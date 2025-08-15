import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import { auth } from '../middleware/auth.js';
import { adminAuth } from '../middleware/adminAuth.js';

const router = Router();

// Get all categories with their styles
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select(`
        id,
        name,
        display_name_tr,
        display_name_en,
        type,
        description,
        description_en,
        image_url,
        is_active,
        styles,
        styles_en,
        created_at
      `)
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Categories fetch error:', error);
      res.status(500).json({
        success: false,
        message: 'Kategoriler yüklenirken hata oluştu'
      });
      return;
    }

    res.json({
      success: true,
      data: categories || []
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
    return;
  }
});

// Get category by ID
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { data: category, error } = await supabase
      .from('categories')
      .select(`
        id,
        name,
        display_name_tr,
        display_name_en,
        type,
        description,
        description_en,
        image_url,
        is_active,
        styles,
        styles_en,
        created_at
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error || !category) {
      res.status(404).json({
        success: false,
        message: 'Kategori bulunamadı'
      });
      return;
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
    return;
  }
});

// Get category by type
router.get('/type/:type', async (req: Request, res: Response): Promise<void> => {
  try {
    const { type } = req.params;

    const { data: category, error } = await supabase
      .from('categories')
      .select(`
        id,
        name,
        display_name_tr,
        display_name_en,
        type,
        description,
        description_en,
        image_url,
        is_active,
        styles,
        styles_en,
        created_at
      `)
      .eq('type', type)
      .eq('is_active', true)
      .single();

    if (error || !category) {
      res.status(404).json({
        success: false,
        message: 'Kategori bulunamadı'
      });
      return;
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Get category by type error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
    return;
  }
});

// Admin routes (protected)

// Create category
router.post('/', adminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('🔥 [CREATE CATEGORY] Request body:', req.body);
    const { name, display_name_tr, display_name_en, type, description, description_en, image_url, styles, styles_en } = req.body;

    if (!name || !type || !display_name_tr || !display_name_en) {
      console.log('🔥 [CREATE CATEGORY] Validation failed:', { name, type, display_name_tr, display_name_en });
      res.status(400).json({
        success: false,
        message: 'Kategori adı, Türkçe ve İngilizce görünen adlar ve tipi gereklidir'
      });
      return;
    }

    // Allow multiple categories with same type
    const insertData = {
      name,
      display_name_tr,
      display_name_en,
      type,
      description,
      description_en,
      image_url,
      styles: styles || [],
      styles_en: styles_en || [],
      is_active: true
    };
    
    console.log('🔥 [CREATE CATEGORY] Insert data:', insertData);

    const { data: category, error } = await supabase
      .from('categories')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('🔥 [CREATE CATEGORY] Supabase error:', error);
      res.status(500).json({
        success: false,
        message: 'Kategori oluşturulurken hata oluştu'
      });
      return;
    }
    
    console.log('🔥 [CREATE CATEGORY] Success:', category);

    res.status(201).json({
      success: true,
      data: category,
      message: 'Kategori başarıyla oluşturuldu'
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
    return;
  }
});

// Update category
router.put('/:id', adminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, display_name_tr, display_name_en, type, description, description_en, image_url, styles, styles_en, is_active } = req.body;

    // Check if category exists
    const { data: existingCategory } = await supabase
      .from('categories')
      .select('id')
      .eq('id', id)
      .single();

    if (!existingCategory) {
      res.status(404).json({
        success: false,
        message: 'Kategori bulunamadı'
      });
      return;
    }

    // If type is being changed, check if new type already exists
    if (type) {
      const { data: typeExists } = await supabase
        .from('categories')
        .select('id')
        .eq('type', type)
        .neq('id', id)
        .single();

      if (typeExists) {
        res.status(400).json({
          success: false,
          message: 'Bu tip zaten mevcut'
        });
        return;
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (display_name_tr !== undefined) updateData.display_name_tr = display_name_tr;
    if (display_name_en !== undefined) updateData.display_name_en = display_name_en;
    if (type !== undefined) updateData.type = type;
    if (description !== undefined) updateData.description = description;
    if (description_en !== undefined) updateData.description_en = description_en;
    if (image_url !== undefined) updateData.image_url = image_url;
    if (styles !== undefined) updateData.styles = styles;
    if (styles_en !== undefined) updateData.styles_en = styles_en;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data: category, error } = await supabase
      .from('categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Category update error:', error);
      res.status(500).json({
        success: false,
        message: 'Kategori güncellenirken hata oluştu'
      });
      return;
    }

    res.json({
      success: true,
      data: category,
      message: 'Kategori başarıyla güncellendi'
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
    return;
  }
});

// Delete category
router.delete('/:id', adminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if category exists
    const { data: existingCategory } = await supabase
      .from('categories')
      .select('id')
      .eq('id', id)
      .single();

    if (!existingCategory) {
      res.status(404).json({
        success: false,
        message: 'Kategori bulunamadı'
      });
      return;
    }

    // Check if category is being used in any image jobs
    const { data: jobsUsingCategory } = await supabase
      .from('image_jobs')
      .select('id')
      .eq('category_id', id)
      .limit(1);

    if (jobsUsingCategory && jobsUsingCategory.length > 0) {
      // Instead of deleting, deactivate the category
      const { error } = await supabase
        .from('categories')
        .update({ is_active: false })
        .eq('id', id);

      if (error) {
        console.error('Category deactivation error:', error);
        res.status(500).json({
          success: false,
          message: 'Kategori deaktive edilirken hata oluştu'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Kategori kullanımda olduğu için deaktive edildi'
      });
      return;
    }

    // Safe to delete
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Category deletion error:', error);
      res.status(500).json({
        success: false,
        message: 'Kategori silinirken hata oluştu'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Kategori başarıyla silindi'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
    return;
  }
});

export default router;