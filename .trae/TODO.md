# TODO:

- [x] pull-github-updates: Sunucuda git pull origin main komutunu çalıştırarak GitHub'daki güncellemeleri çek (priority: High)
- [x] fix-ecosystem-config: Ecosystem.config.cjs dosyasını kontrol et ve TypeScript dosyalarını doğru şekilde çalıştıracak şekilde düzenle (priority: High)
- [x] fix-dirname-usage: Server.ts dosyasındaki __dirname kullanımını import.meta.url ile ES module uyumlu hale getir (priority: High)
- [x] fix-missing-imports: Server.ts dosyasına eksik import statements'ları ekle (express, helmet, cors) (priority: High)
- [x] fix-typescript-errors: Server.ts dosyasındaki tüm TypeScript hatalarını düzelt (CORS origin, error handler types, PORT type) (priority: High)
- [x] fix-tsconfig-issues: tsconfig.json dosyasındaki allowImportingTsExtensions sorununu çöz (priority: High)
- [x] push-to-github: Değişiklikleri GitHub'a push et (priority: Medium)
- [ ] fix-supabase-import: api/routes/auth.ts dosyasındaki supabase import hatasını düzelt (**IN PROGRESS**) (priority: High)
- [ ] restart-pm2-services: PM2 servislerini yeniden başlat (priority: High)
- [ ] verify-supabase-config: api/config/supabase.ts dosyasının var olduğunu kontrol et (priority: High)
- [ ] verify-services-running: API ve frontend servislerinin düzgün çalıştığını kontrol et (priority: Medium)
