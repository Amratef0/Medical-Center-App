/** Canonical permission keys seeded in migrations and exposed via GET /permissions */
export const PERMISSION_CATALOGUE: Array<{
  key: string;
  description_ar: string;
  description_en: string;
}> = [
  // Route enforcement (MCSOS §7)
  {
    key: 'packages.assign',
    description_ar: 'تسكين الباقات العلاجية للمرضى',
    description_en: 'Assign treatment packages to patients',
  },
  {
    key: 'finance.verify_payment',
    description_ar: 'اعتماد وتأكيد دفع جلسات التقييم',
    description_en: 'Verify assessment session payments',
  },
  {
    key: 'sessions.evaluation_report',
    description_ar: 'كتابة وتعديل تقارير تقييم الجلسات',
    description_en: 'Write and update session evaluation reports',
  },
  {
    key: 'settings.manage',
    description_ar: 'إدارة إعدادات النظام',
    description_en: 'Manage system settings',
  },
  // RBAC matrix UI catalogue
  {
    key: 'perm_create_booking',
    description_ar: 'إنشاء وإدارة المواعيد الطبية',
    description_en: 'Create and manage medical appointments',
  },
  {
    key: 'perm_cancel_booking',
    description_ar: 'إلغاء الحجوزات أو نقل المواعيد',
    description_en: 'Cancel bookings or reschedule appointments',
  },
  {
    key: 'perm_override_capacity',
    description_ar: 'استثناء وتجاوز الحد الأقصى للسعة الطبية',
    description_en: 'Override medical capacity limits',
  },
  {
    key: 'perm_record_noshow',
    description_ar: 'تسجيل حالات غياب المرضى دون إشعار',
    description_en: 'Record patient no-shows',
  },
  {
    key: 'perm_view_medical_records',
    description_ar: 'الوصول للسجلات والتشخيصات الطبية الكاملة',
    description_en: 'View full medical records and diagnoses',
  },
  {
    key: 'perm_edit_clinical_notes',
    description_ar: 'كتابة وتعديل التقارير العلاجية والجلسات',
    description_en: 'Edit clinical notes and session reports',
  },
  {
    key: 'perm_manage_treatment_plans',
    description_ar: 'إدارة خطط العلاج وتقييم التقدم',
    description_en: 'Manage treatment plans and progress',
  },
  {
    key: 'perm_create_invoice',
    description_ar: 'إصدار الفواتير وتسجيل سندات الصرف',
    description_en: 'Create invoices and payment vouchers',
  },
  {
    key: 'perm_apply_discount',
    description_ar: 'منح الخصومات الاستثنائية والاعتمادات',
    description_en: 'Apply exceptional discounts',
  },
  {
    key: 'perm_issue_refund',
    description_ar: 'الموافقة على استرداد الدفعات المالية',
    description_en: 'Approve payment refunds',
  },
  {
    key: 'perm_view_revenue',
    description_ar: 'عرض التقارير المالية وصافي الإيرادات',
    description_en: 'View financial reports and revenue',
  },
  {
    key: 'perm_adjust_inventory',
    description_ar: 'تعديل كميات المخزون والصرف الطبي',
    description_en: 'Adjust inventory quantities',
  },
  {
    key: 'perm_approve_orders',
    description_ar: 'اعتماد طلبات شراء المستلزمات الطبية',
    description_en: 'Approve medical supply purchase orders',
  },
  {
    key: 'perm_manage_users',
    description_ar: 'إضافة وتعديل وحذف ملفات الموظفين',
    description_en: 'Manage staff user accounts',
  },
  {
    key: 'perm_manage_roles',
    description_ar: 'إنشاء الأدوار وتخصيص صلاحيات RBAC',
    description_en: 'Manage roles and RBAC permissions',
  },
  {
    key: 'perm_view_audit',
    description_ar: 'مطالعة سجلات الحوكمة وتتبع حركة النظام',
    description_en: 'View audit and governance logs',
  },
];

const ALL_MATRIX_KEYS = PERMISSION_CATALOGUE.map((p) => p.key);

/** Default role grants aligned with RbacPermissionsMatrix.jsx system roles + @Roles on enforced routes */
export const DEFAULT_ROLE_GRANTS: Record<string, string[]> = {
  ADMIN: [...ALL_MATRIX_KEYS],
  DOCTOR: [
    'sessions.evaluation_report',
    'perm_view_medical_records',
    'perm_edit_clinical_notes',
    'perm_manage_treatment_plans',
    'perm_record_noshow',
  ],
  RECEPTIONIST: [
    'packages.assign',
    'finance.verify_payment',
    'perm_create_booking',
    'perm_cancel_booking',
    'perm_record_noshow',
    'perm_create_invoice',
  ],
  FINANCE: [
    'finance.verify_payment',
    'perm_create_invoice',
    'perm_apply_discount',
    'perm_issue_refund',
    'perm_view_revenue',
    'perm_view_audit',
  ],
  OPERATIONS_MANAGER: [
    'perm_create_booking',
    'perm_cancel_booking',
    'perm_override_capacity',
    'perm_adjust_inventory',
    'perm_approve_orders',
    'perm_view_audit',
  ],
  CUSTOMER_SUPPORT: [],
};
