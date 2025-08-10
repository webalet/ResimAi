import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { supabase } from '../config/supabase';
import { auth } from '../middleware/auth';

const router = Router();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil'
});

// Subscription plans
const PLANS = {
  basic: {
    name: 'Temel',
    credits: 50,
    price: 29,
    priceId: process.env.STRIPE_BASIC_PRICE_ID || 'price_basic'
  },
  pro: {
    name: 'Profesyonel',
    credits: 150,
    price: 79,
    priceId: process.env.STRIPE_PRO_PRICE_ID || 'price_pro'
  },
  enterprise: {
    name: 'Kurumsal',
    credits: 500,
    price: 199,
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise'
  }
};

// Get available plans
router.get('/plans', async (req: Request, res: Response) => {
  try {
    const plans = Object.entries(PLANS).map(([id, plan]) => ({
      id,
      ...plan
    }));

    res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Get current subscription
router.get('/current', auth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Subscription fetch error:', error);
      return res.status(500).json({
        success: false,
        message: 'Abonelik bilgileri yüklenirken hata oluştu'
      });
    }

    res.json({
      success: true,
      data: subscription || null
    });
  } catch (error) {
    console.error('Get current subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Create subscription
router.post('/create', auth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { planId } = req.body;

    if (!planId || !PLANS[planId as keyof typeof PLANS]) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz plan ID'
      });
    }

    // Get user info
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email, name')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    // Check if user already has an active subscription
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: 'Zaten aktif bir aboneliğiniz var'
      });
    }

    const plan = PLANS[planId as keyof typeof PLANS];

    // Create or get Stripe customer
    let customerId: string;
    
    // Check if customer already exists
    const { data: existingCustomer } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (existingCustomer?.stripe_customer_id) {
      customerId = existingCustomer.stripe_customer_id;
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: userId
        }
      });
      
      customerId = customer.id;
      
      // Save customer ID to user record
      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan.priceId,
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/subscription?success=true`,
      cancel_url: `${process.env.FRONTEND_URL}/subscription?canceled=true`,
      metadata: {
        userId: userId,
        planId: planId
      }
    });

    res.json({
      success: true,
      data: {
        checkout_url: session.url
      }
    });
  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Abonelik oluşturulurken hata oluştu'
    });
  }
});

// Cancel subscription
router.post('/cancel', auth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    // Get current subscription
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (error || !subscription) {
      return res.status(404).json({
        success: false,
        message: 'Aktif abonelik bulunamadı'
      });
    }

    // Cancel subscription in Stripe
    await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      cancel_at_period_end: true
    });

    // Update subscription status
    await supabase
      .from('subscriptions')
      .update({ 
        status: 'canceled',
        canceled_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('status', 'active');

    res.json({
      success: true,
      message: 'Abonelik iptal edildi'
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Abonelik iptal edilirken hata oluştu'
    });
  }
});

// Stripe webhook handler
router.post('/webhook', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('Stripe webhook secret not configured');
    return res.status(400).send('Webhook secret not configured');
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const planId = session.metadata?.planId;

        if (!userId || !planId) {
          console.error('Missing metadata in checkout session');
          break;
        }

        const plan = PLANS[planId as keyof typeof PLANS];
        if (!plan) {
          console.error('Invalid plan ID in checkout session');
          break;
        }

        // Get the subscription from Stripe
        const stripeSubscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        ) as any;

        // Create subscription record
        await supabase.from('subscriptions').insert({
          user_id: userId,
          stripe_subscription_id: stripeSubscription.id,
          stripe_customer_id: session.customer as string,
          plan_name: plan.name,
          status: 'active',
          current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString()
        });

        // Add credits to user
        const { data: user } = await supabase
          .from('users')
          .select('credits')
          .eq('id', userId)
          .single();

        if (user) {
          await supabase
            .from('users')
            .update({ credits: user.credits + plan.credits })
            .eq('id', userId);
        }

        // Record payment
        await supabase.from('payments').insert({
          user_id: userId,
          stripe_payment_intent_id: session.payment_intent as string,
          amount: plan.price,
          currency: 'try',
          status: 'completed',
          plan_name: plan.name
        });

        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any;
        const subscriptionId = typeof invoice.subscription === 'string' 
          ? invoice.subscription 
          : invoice.subscription?.id || '';

        // Get subscription from database
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('user_id, plan_name')
          .eq('stripe_subscription_id', subscriptionId)
          .single();

        if (!subscription) {
          console.error('Subscription not found for invoice');
          break;
        }

        // Find plan by name
        const planEntry = Object.entries(PLANS).find(
          ([, plan]) => plan.name === subscription.plan_name
        );

        if (!planEntry) {
          console.error('Plan not found for subscription');
          break;
        }

        const [, plan] = planEntry;

        // Add credits for renewal
        const { data: user } = await supabase
          .from('users')
          .select('credits')
          .eq('id', subscription.user_id)
          .single();

        if (user) {
          await supabase
            .from('users')
            .update({ credits: user.credits + plan.credits })
            .eq('id', subscription.user_id);
        }

        // Record payment
        await supabase.from('payments').insert({
          user_id: subscription.user_id,
          stripe_payment_intent_id: invoice.payment_intent || invoice.charge || '',
          amount: plan.price,
          currency: 'try',
          status: 'completed',
          plan_name: plan.name
        });

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        // Update subscription status
        await supabase
          .from('subscriptions')
          .update({ 
            status: 'canceled',
            canceled_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscription.id);

        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

// Get user credits
router.get('/credits', auth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const { data: user, error } = await supabase
      .from('users')
      .select('credits')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    res.json({
      success: true,
      data: {
        remaining_credits: user.credits
      }
    });
  } catch (error) {
    console.error('Get credits error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Get subscription history
router.get('/history', auth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Subscription history fetch error:', error);
      return res.status(500).json({
        success: false,
        message: 'Abonelik geçmişi yüklenirken hata oluştu'
      });
    }

    res.json({
      success: true,
      data: subscriptions || []
    });
  } catch (error) {
    console.error('Get subscription history error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Get payment history
router.get('/payments', auth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const { data: payments, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Payment history fetch error:', error);
      return res.status(500).json({
        success: false,
        message: 'Ödeme geçmişi yüklenirken hata oluştu'
      });
    }

    res.json({
      success: true,
      data: payments || []
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

export default router;