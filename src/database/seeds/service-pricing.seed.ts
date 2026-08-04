import { DataSource } from 'typeorm';
import { Service, ServiceCategory } from '../../modules/services/service.entity';
import { Package } from '../../modules/packages/package.entity';
import { PackageService } from '../../modules/packages/package-service.entity';

export async function seedServicePricing(dataSource: DataSource) {
  console.log('🌱 Cleaning old services and packages data...');

  // Nullify session references to avoid foreign key violation if sessions exist
  try {
    await dataSource.query(
      `UPDATE sessions SET service_id = NULL, patient_package_id = NULL WHERE service_id IS NOT NULL OR patient_package_id IS NOT NULL`
    );
  } catch (e) {
    // Ignore if table doesn't exist yet or columns differ
  }

  try {
    await dataSource.query(`DELETE FROM treatment_plan_services`);
  } catch (e) {
    // Ignore if table doesn't exist
  }

  try {
    await dataSource.query(`DELETE FROM patient_packages`);
  } catch (e) {
    // Ignore if table doesn't exist
  }

  try {
    await dataSource.query(`DELETE FROM package_services`);
  } catch (e) {
    // Ignore if table doesn't exist
  }

  try {
    await dataSource.query(`DELETE FROM packages`);
  } catch (e) {
    // Ignore if table doesn't exist
  }

  try {
    await dataSource.query(`DELETE FROM services`);
  } catch (e) {
    // Ignore if table doesn't exist
  }

  console.log('🌱 Seeding 44 Medical Services from official pricing sheet...');
  const servicesRepo = dataSource.getRepository(Service);
  const packagesRepo = dataSource.getRepository(Package);
  const packageServicesRepo = dataSource.getRepository(PackageService);

  const servicesData = [
    // 1. NEURO_PT (علاج طبيعي أعصاب)
    { category: ServiceCategory.NEURO_PT, name: 'علاج مائي', price: 450, price_package_6: 350, price_package_12: 300, duration: '30 - 45 د', sort_order: 1 },
    { category: ServiceCategory.NEURO_PT, name: 'علاج وظيفي O.T', price: 400, price_package_6: 350, price_package_12: 275, duration: '45 د', sort_order: 2 },
    { category: ServiceCategory.NEURO_PT, name: 'مشى بالتعليق', price: 250, duration: '30 د', sort_order: 3 },
    { category: ServiceCategory.NEURO_PT, name: 'جلسة إتزان', price: 450, price_package_6: 350, price_package_12: 325, duration: 'ساعة', sort_order: 4 },
    { category: ServiceCategory.NEURO_PT, name: 'جلسة علاج طبيعي أعصاب', price: 450, price_package_6: 350, price_package_12: 325, duration: 'ساعة', sort_order: 5 },
    { category: ServiceCategory.NEURO_PT, name: 'تنبيه كهربي للجزء الواحد', price: 275, price_package_6: 250, price_package_12: 225, duration: '15 د', sort_order: 6 },
    { category: ServiceCategory.NEURO_PT, name: 'سرير الاماله', price: 250, duration: '10 د - 30 د', sort_order: 7 },
    { category: ServiceCategory.NEURO_PT, name: 'تأهيل المثانة ( تحكم بالبول )', price: 500, price_package_6: 400, duration: 'ساعة', sort_order: 8 },

    // 2. ORTHO_PT (علاج طبيعي عظام)
    { category: ServiceCategory.ORTHO_PT, name: 'جلسة علاج طبيعي عظام', price: 450, price_package_6: 400, price_package_12: 350, duration: '30 د - 1 ساعة', sort_order: 1 },
    { category: ServiceCategory.ORTHO_PT, name: 'جلسة ليزر علاجي', price: 350, price_package_6: 325, price_package_12: 300, duration: '5 - 15 د', sort_order: 2 },
    { category: ServiceCategory.ORTHO_PT, name: 'علاج طبيعي عظام جزئين', price: 750, price_package_6: 700, price_package_12: 650, duration: 'ساعة ونص', sort_order: 3 },
    { category: ServiceCategory.ORTHO_PT, name: 'علاج طبيعي عظام جزئين ركبتين', price: 700, price_package_6: 650, price_package_12: 600, duration: 'ساعة', sort_order: 4 },
    { category: ServiceCategory.ORTHO_PT, name: 'حجامة', price: 600, duration: '12 كاس', sort_order: 5 },
    { category: ServiceCategory.ORTHO_PT, name: 'ريكافري ، مساج للجسم كامل', price: 1500, duration: 'ساعة', sort_order: 6 },
    { category: ServiceCategory.ORTHO_PT, name: 'جهاز لمفاوي', price: 350, price_package_6: 325, price_package_12: 300, duration: '20 د', sort_order: 7 },
    { category: ServiceCategory.ORTHO_PT, name: 'إبر صينية', price: 350, duration: '30 د', sort_order: 8 },
    { category: ServiceCategory.ORTHO_PT, name: 'لمفاوي يدوي', price: 500, duration: '30 د', sort_order: 9 },
    { category: ServiceCategory.ORTHO_PT, name: 'جيم بوجود طبيب', price: 300, price_package_6: 275, price_package_12: 250, duration: '45 د', sort_order: 10 },
    { category: ServiceCategory.ORTHO_PT, name: 'مساج علاجي للجزء الواحد', price: 450, duration: '30 د', sort_order: 11 },
    { category: ServiceCategory.ORTHO_PT, name: 'جلسه اجهزه (موجات صوتية -اشعه حمراء-تنس)', price: 250, duration: '30 د - 1 ساعة', sort_order: 12 },

    // 3. PEDIATRIC_PT (علاج طبيعي أطفال)
    { category: ServiceCategory.PEDIATRIC_PT, name: 'تقيم أطفال', price: 350, sort_order: 1 },
    { category: ServiceCategory.PEDIATRIC_PT, name: 'علاج طبيعي للأطفال', price: 300, price_package_6: 275, price_package_12: 250, sort_order: 2 },
    { category: ServiceCategory.PEDIATRIC_PT, name: 'علاج مائى أطفال', price: 400, price_package_6: 350, price_package_12: 300, sort_order: 3 },
    { category: ServiceCategory.PEDIATRIC_PT, name: 'تخاطب أطفال', price: 300, price_package_6: 275, price_package_12: 250, sort_order: 4 },
    { category: ServiceCategory.PEDIATRIC_PT, name: 'تقيم نفسى أطفال', price: 400, sort_order: 5 },
    { category: ServiceCategory.PEDIATRIC_PT, name: 'علاج وظيفي O.T أطفال', price: 400, price_package_6: 350, price_package_12: 300, sort_order: 6 },

    // 4. SPEECH_THERAPY (التخاطب)
    { category: ServiceCategory.SPEECH_THERAPY, name: 'إختبار اللغة', price: 650, sort_order: 1 },
    { category: ServiceCategory.SPEECH_THERAPY, name: 'الإختبار النفسي', price: 600, sort_order: 2 },
    { category: ServiceCategory.SPEECH_THERAPY, name: 'إختبار ذكاء', price: 850, sort_order: 3 },
    { category: ServiceCategory.SPEECH_THERAPY, name: 'إختبار صعوبة تعلم', price: 500, sort_order: 4 },
    { category: ServiceCategory.SPEECH_THERAPY, name: 'إختبار فرط حركة', price: 500, sort_order: 5 },
    { category: ServiceCategory.SPEECH_THERAPY, name: 'تخاطب', price: 300, price_package_6: 275, price_package_12: 250, sort_order: 6 },
    { category: ServiceCategory.SPEECH_THERAPY, name: 'تعديل سلوك', price: 350, price_package_6: 325, price_package_12: 300, sort_order: 7 },
    { category: ServiceCategory.SPEECH_THERAPY, name: 'تقييم نفسي', price: 400, price_package_6: 375, price_package_12: 350, sort_order: 8 },
    { category: ServiceCategory.SPEECH_THERAPY, name: 'تكامل حسي', price: 350, price_package_6: 325, price_package_12: 300, sort_order: 9 },
    { category: ServiceCategory.SPEECH_THERAPY, name: 'تنمية المهارات ( أكاديمي )', price: 275, price_package_6: 250, price_package_12: 225, duration: 'ساعة', sort_order: 10 },

    // 5. NUTRITION (التغذية)
    { category: ServiceCategory.NUTRITION, name: 'كشف التغذية العلاجية والتخسيس', price: 550, duration: 'P + IMP', sort_order: 1 },
    { category: ServiceCategory.NUTRITION, name: 'جلسة كافيتيشن ( علي جزء واحد )', price: 250, price_package_6: 225, price_package_12: 225, duration: 'P + RF', sort_order: 2 },
    { category: ServiceCategory.NUTRITION, name: 'متابعة التغذية', price: 200, notes: 'وزن + نظام', sort_order: 3 },

    // 6. GENERAL (خدمات عامة وأخرى)
    { category: ServiceCategory.GENERAL, name: 'تقييم علاج طبيعي', price: 350, sort_order: 1 },
    { category: ServiceCategory.GENERAL, name: 'كشف طبيب خارجي', price: 600, sort_order: 2 },
    { category: ServiceCategory.GENERAL, name: 'كشف طبيب زيارة خاصة', price: 1200, sort_order: 3 },
    { category: ServiceCategory.GENERAL, name: 'جلسات منزلية', price: 750, notes: 'حسب المكان', sort_order: 4 },
    { category: ServiceCategory.GENERAL, name: 'طلب خدمة معاونة', price: 350, sort_order: 5 },
  ];

  const savedServices: Service[] = [];
  for (const item of servicesData) {
    const srv = servicesRepo.create({
      ...item,
      is_active: true,
    });
    const saved = await servicesRepo.save(srv);
    savedServices.push(saved);
  }
  console.log(`✅ Successfully seeded ${savedServices.length} medical services`);

  console.log('🌱 Generating template packages for 6 and 12 sessions...');
  let packagesCount = 0;

  for (const srv of savedServices) {
    // Generate 6-session package if price_package_6 exists
    if (srv.price_package_6 && srv.price_package_6 > 0) {
      const totalPrice6 = Number(srv.price_package_6) * 6;
      const pkg6 = packagesRepo.create({
        name: `باكدج ${srv.name} (6 جلسات)`,
        description: `باقة تتضمن 6 جلسات من ${srv.name} بسعر مخفض للجلسة (${srv.price_package_6} ج.م بدلاً من ${srv.price || srv.price_package_6} ج.م)`,
        total_sessions: 6,
        expiry_days: 60,
        price: totalPrice6,
        is_custom: false,
        is_active: true,
      });
      const savedPkg6 = await packagesRepo.save(pkg6);

      const pkgSrv6 = packageServicesRepo.create({
        package_id: savedPkg6.id,
        service_id: srv.id,
        session_count: 6,
      });
      await packageServicesRepo.save(pkgSrv6);
      packagesCount++;
    }

    // Generate 12-session package if price_package_12 exists
    if (srv.price_package_12 && srv.price_package_12 > 0) {
      const totalPrice12 = Number(srv.price_package_12) * 12;
      const pkg12 = packagesRepo.create({
        name: `باكدج ${srv.name} (12 جلسة)`,
        description: `باقة تتضمن 12 جلسة من ${srv.name} بسعر مخفض للجلسة (${srv.price_package_12} ج.م بدلاً من ${srv.price || srv.price_package_12} ج.م)`,
        total_sessions: 12,
        expiry_days: 90,
        price: totalPrice12,
        is_custom: false,
        is_active: true,
      });
      const savedPkg12 = await packagesRepo.save(pkg12);

      const pkgSrv12 = packageServicesRepo.create({
        package_id: savedPkg12.id,
        service_id: srv.id,
        session_count: 12,
      });
      await packageServicesRepo.save(pkgSrv12);
      packagesCount++;
    }
  }

  console.log(`✅ Successfully seeded ${packagesCount} ready-to-use template packages`);
}
