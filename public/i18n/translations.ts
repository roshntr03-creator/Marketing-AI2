// i18n/translations.ts

const translations = {
  en: {
    // General
    dashboard: 'Dashboard',
    tools: 'Tools',
    analytics: 'Analytics',
    settings: 'Settings',
    close: 'Close',
    generate: 'Generate',
    generating_content: 'Generating content, please wait...',
    retry_status: 'Service is busy. Retrying in {delaySeconds} seconds...',
    view_sources: 'View Sources',
    sources: 'Sources',
    generated_on: 'Generated on',
    
    // Login
    email_address: 'Email Address',
    password: 'Password',
    login: 'Login',
    login_with_google: 'Login with Google',
    login_to_account: 'Login to your account',
    or_continue_with: 'Or continue with',

    // Dashboard
    welcome_back: 'Welcome back',
    featured_tools: 'Featured Tools',
    marketing_tip: 'Marketing Tip of the Day',
    tip_title: 'Engage with Video Content',
    tip_content: 'Short-form videos on platforms like TikTok and Instagram Reels are booming. Create quick, engaging videos to showcase your product and connect with your audience.',

    // Analytics
    analytics_preview: 'Usage Analytics',
    analytics_preview_desc: 'Analytics are coming soon! Track your content generation and tool usage here.',
    generation_history: 'Generation History',
    no_history_title: 'No History Yet',
    no_history_desc: 'Start creating content with our tools and your history will appear here.',

    // Settings
    profile: 'Profile',
    full_name: 'Full Name',
    save_profile: 'Save Profile',
    security: 'Security',
    new_password: 'New Password',
    confirm_new_password: 'Confirm New Password',
    change_password: 'Change Password',
    subscription: 'Subscription',
    current_plan: 'Current Plan',
    free_plan: 'Free Plan',
    upgrade_to_pro: 'Upgrade to Pro',
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    language: 'Language',
    english: 'English',
    arabic: 'Arabic',
    logout: 'Logout',
    profile_saved_success: 'Profile saved successfully!',
    profile_update_error: 'Failed to update profile.',
    passwords_do_not_match: "Passwords do not match.",
    password_changed_success: 'Password changed successfully!',
    password_update_error: 'Failed to change password. You may need to log in again.',
    pro_features_coming_soon: 'Pro Features Coming Soon!',
    pro_features_desc: 'Upgrade to unlock advanced analytics, priority support, and more.',
    pro_feature_1: 'Advanced Analytics',
    pro_feature_2: 'Higher Generation Limits',
    pro_feature_3: 'Priority Support',
    troubleshooting: 'Troubleshooting',
    firebase_config_help_title: 'Firebase Configuration',
    firebase_config_help_content: 'Ensure your `firebase/functions/.env` file contains your API_KEY and your Firebase project is correctly configured.',
    backend_functions_help_title: 'Backend Functions',
    backend_functions_help_content: 'If you encounter server errors, check the Firebase Functions logs for your project for more details.',


    // Lottie
    generating_animation_label: 'AI is generating content animation',

    // Tool Categories
    audience_growth_strategy: 'Audience Growth & Strategy',
    content_creation: 'Creative Content Generation',
    campaign_management: 'Campaign & Outreach',

    // SEO Assistant
    seo_assistant_name: 'SEO Content Assistant',
    seo_assistant_desc: 'Generate content briefs and outlines for any topic.',
    topic_label: 'Topic',
    seo_placeholder: 'e.g., "digital marketing for small business"',

    // Influencer Discovery
    influencer_discovery_name: 'Influencer Discovery',
    influencer_discovery_desc: 'Find micro-influencers in your niche and city.',
    city_label: 'City',
    city_placeholder: 'e.g., "Dubai"',
    field_label: 'Niche / Field',
    field_placeholder: 'e.g., "fashion" or "tech"',

    // Social Media Optimizer
    social_media_optimizer_name: 'Social Media Optimizer',
    social_media_optimizer_desc: 'Get growth strategies and content ideas for your industry.',
    your_industry_label: 'Your Industry',
    industry_placeholder: 'e.g., "e-commerce"',
    
    // Video Script Assistant
    video_script_assistant_name: 'Video Script Assistant',
    video_script_assistant_desc: 'Create engaging scripts for short-form videos.',
    video_idea_label: 'Video Idea',
    video_idea_placeholder: 'e.g., "a 30-second video showcasing our new product feature"',

    // Short-form Factory
    short_form_factory_name: 'Short-Form Factory',
    short_form_factory_desc: 'Repurpose long content or product images into video ideas.',
    long_form_content_label: 'Long-Form Content',
    long_form_content_placeholder: 'Paste an article, blog post, or description here...',
    or_upload_product_image_label: '...or upload a product image',

    // SMM Content Plan
    smm_content_plan_name: 'SMM Content Plan',
    smm_content_plan_desc: 'Generate a 7-day content calendar for any platform.',
    platform_label: 'Social Media Platform',
    platform_placeholder: 'e.g., "Instagram"',
    smm_topic_placeholder: 'e.g., "healthy recipes"',

    // AI Video Generator
    ai_video_generator_name: 'AI Video Generator',
    ai_video_generator_desc: 'Create a video from a text prompt.',
    video_generator_placeholder: 'e.g., "A neon hologram of a cat driving a sports car at top speed"',
    video_ready: 'Your Video is Ready!',

    // Ads AI Assistant
    ads_ai_assistant_name: 'Ads AI Assistant',
    ads_ai_assistant_desc: 'Generate compelling ad copy for your campaigns.',
    product_description_label: 'Product Description',
    product_description_placeholder: 'Describe your product or service...',
    target_audience_label: 'Target Audience',
    target_audience_placeholder: 'e.g., "young professionals aged 25-35"',
    
    // Email Marketing
    email_marketing_name: 'Email Marketing',
    email_marketing_desc: 'Craft effective marketing emails for any goal.',
    campaign_goal_label: 'Campaign Goal',
    campaign_goal_placeholder: 'e.g., "announce a new product launch"',

    // Customer Persona
    customer_persona_name: 'Customer Persona Generator',
    customer_persona_desc: 'Create detailed personas for your target market.',
    product_service_label: 'Product/Service',
    product_service_placeholder: 'Describe what you sell...',
    target_audience_details_label: 'Target Audience Details',
    target_audience_details_placeholder: 'Describe your target customers, their age, interests, etc...',
  },
  ar: {
    // General
    dashboard: 'لوحة التحكم',
    tools: 'الأدوات',
    analytics: 'التحليلات',
    settings: 'الإعدادات',
    close: 'إغلاق',
    generate: 'إنشاء',
    generating_content: 'جاري إنشاء المحتوى، يرجى الانتظار...',
    retry_status: 'الخدمة مشغولة. جاري إعادة المحاولة خلال {delaySeconds} ثانية...',
    view_sources: 'عرض المصادر',
    sources: 'المصادر',
    generated_on: 'تم الإنشاء في',

    // Login
    email_address: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    login: 'تسجيل الدخول',
    login_with_google: 'تسجيل الدخول باستخدام جوجل',
    login_to_account: 'سجل الدخول إلى حسابك',
    or_continue_with: 'أو المتابعة باستخدام',

    // Dashboard
    welcome_back: 'مرحباً بعودتك',
    featured_tools: 'الأدوات المميزة',
    marketing_tip: 'نصيحة اليوم في التسويق',
    tip_title: 'تفاعل مع محتوى الفيديو',
    tip_content: 'تنتشر مقاطع الفيديو القصيرة على منصات مثل تيك توك وإنستغرام ريلز بشكل كبير. أنشئ مقاطع فيديو سريعة وجذابة لعرض منتجك والتواصل مع جمهورك.',
    
    // Analytics
    analytics_preview: 'تحليلات الاستخدام',
    analytics_preview_desc: 'التحليلات قادمة قريباً! تتبع إنشاء المحتوى واستخدام الأدوات هنا.',
    generation_history: 'سجل الإنشاء',
    no_history_title: 'لا يوجد سجل حتى الآن',
    no_history_desc: 'ابدأ في إنشاء المحتوى باستخدام أدواتنا وسيظهر سجلك هنا.',

    // Settings
    profile: 'الملف الشخصي',
    full_name: 'الاسم الكامل',
    save_profile: 'حفظ الملف الشخصي',
    security: 'الأمان',
    new_password: 'كلمة المرور الجديدة',
    confirm_new_password: 'تأكيد كلمة المرور الجديدة',
    change_password: 'تغيير كلمة المرور',
    subscription: 'الاشتراك',
    current_plan: 'الخطة الحالية',
    free_plan: 'الخطة المجانية',
    upgrade_to_pro: 'الترقية إلى Pro',
    theme: 'المظهر',
    light: 'فاتح',
    dark: 'داكن',
    language: 'اللغة',
    english: 'الإنجليزية',
    arabic: 'العربية',
    logout: 'تسجيل الخروج',
    profile_saved_success: 'تم حفظ الملف الشخصي بنجاح!',
    profile_update_error: 'فشل تحديث الملف الشخصي.',
    passwords_do_not_match: 'كلمتا المرور غير متطابقتين.',
    password_changed_success: 'تم تغيير كلمة المرور بنجاح!',
    password_update_error: 'فشل تغيير كلمة المرور. قد تحتاج إلى تسجيل الدخول مرة أخرى.',
    pro_features_coming_soon: 'ميزات Pro قادمة قريبًا!',
    pro_features_desc: 'قم بالترقية لفتح التحليلات المتقدمة والدعم ذي الأولوية والمزيد.',
    pro_feature_1: 'تحليلات متقدمة',
    pro_feature_2: 'حدود إنشاء أعلى',
    pro_feature_3: 'دعم ذو أولوية',
    troubleshooting: 'استكشاف الأخطاء وإصلاحها',
    firebase_config_help_title: 'إعداد Firebase',
    firebase_config_help_content: 'تأكد من أن ملف `firebase/functions/.env` الخاص بك يحتوي على API_KEY وأن مشروع Firebase الخاص بك تم إعداده بشكل صحيح.',
    backend_functions_help_title: 'وظائف الواجهة الخلفية',
    backend_functions_help_content: 'إذا واجهت أخطاء في الخادم ، فتحقق من سجلات وظائف Firebase لمشروعك لمزيد من التفاصيل.',

    // Lottie
    generating_animation_label: 'رسوم متحركة لإنشاء المحتوى بواسطة الذكاء الاصطناعي',

    // Tool Categories
    audience_growth_strategy: 'نمو الجمهور والاستراتيجية',
    content_creation: 'إنشاء المحتوى الإبداعي',
    campaign_management: 'إدارة الحملات والتواصل',
    
    // SEO Assistant
    seo_assistant_name: 'مساعد محتوى SEO',
    seo_assistant_desc: 'أنشئ ملخصات ومخططات محتوى لأي موضوع.',
    topic_label: 'الموضوع',
    seo_placeholder: 'مثال: "التسويق الرقمي للشركات الصغيرة"',

    // Influencer Discovery
    influencer_discovery_name: 'اكتشاف المؤثرين',
    influencer_discovery_desc: 'ابحث عن المؤثرين الصغار في مجالك ومدينتك.',
    city_label: 'المدينة',
    city_placeholder: 'مثال: "دبي"',
    field_label: 'المجال / التخصص',
    field_placeholder: 'مثال: "الأزياء" أو "التكنولوجيا"',
    
    // Social Media Optimizer
    social_media_optimizer_name: 'محسن وسائل التواصل الاجتماعي',
    social_media_optimizer_desc: 'احصل على استراتيجيات نمو وأفكار محتوى لصناعتك.',
    your_industry_label: 'مجال عملك',
    industry_placeholder: 'مثال: "التجارة الإلكترونية"',
    
    // Video Script Assistant
    video_script_assistant_name: 'مساعد سيناريو الفيديو',
    video_script_assistant_desc: 'أنشئ نصوصًا جذابة لمقاطع الفيديو القصيرة.',
    video_idea_label: 'فكرة الفيديو',
    video_idea_placeholder: 'مثال: "فيديو مدته 30 ثانية يعرض ميزة منتجنا الجديد"',

    // Short-form Factory
    short_form_factory_name: 'مصنع المحتوى القصير',
    short_form_factory_desc: 'أعد استخدام المحتوى الطويل أو صور المنتج إلى أفكار فيديو.',
    long_form_content_label: 'محتوى طويل',
    long_form_content_placeholder: 'الصق مقالًا أو منشور مدونة أو وصفًا هنا ...',
    or_upload_product_image_label: '... أو قم بتحميل صورة منتج',

    // SMM Content Plan
    smm_content_plan_name: 'خطة محتوى SMM',
    smm_content_plan_desc: 'أنشئ تقويم محتوى لمدة 7 أيام لأي منصة.',
    platform_label: 'منصة التواصل الاجتماعي',
    platform_placeholder: 'مثال: "انستغرام"',
    smm_topic_placeholder: 'مثال: "وصفات صحية"',

    // AI Video Generator
    ai_video_generator_name: 'مولد الفيديو بالذكاء الاصطناعي',
    ai_video_generator_desc: 'أنشئ مقطع فيديو من مطالبة نصية.',
    video_generator_placeholder: 'مثال: "صورة ثلاثية الأبعاد نيون لقط يقود سيارة رياضية بأقصى سرعة"',
    video_ready: 'الفيديو الخاص بك جاهز!',

    // Ads AI Assistant
    ads_ai_assistant_name: 'مساعد إعلانات الذكاء الاصطناعي',
    ads_ai_assistant_desc: 'أنشئ نسخة إعلانية مقنعة لحملاتك.',
    product_description_label: 'وصف المنتج',
    product_description_placeholder: 'صف منتجك أو خدمتك ...',
    target_audience_label: 'الجمهور المستهدف',
    target_audience_placeholder: 'مثال: "المهنيون الشباب الذين تتراوح أعمارهم بين 25 و 35 عامًا"',
    
    // Email Marketing
    email_marketing_name: 'التسويق عبر البريد الإلكتروني',
    email_marketing_desc: 'صياغة رسائل بريد إلكتروني تسويقية فعالة لأي هدف.',
    campaign_goal_label: 'هدف الحملة',
    campaign_goal_placeholder: 'مثال: "الإعلان عن إطلاق منتج جديد"',

    // Customer Persona
    customer_persona_name: 'مولد شخصية العميل',
    customer_persona_desc: 'أنشئ شخصيات مفصلة للسوق المستهدف.',
    product_service_label: 'المنتج / الخدمة',
    product_service_placeholder: 'صف ما تبيعه ...',
    target_audience_details_label: 'تفاصيل الجمهور المستهدف',
    target_audience_details_placeholder: 'صف عملاءك المستهدفين وأعمارهم واهتماماتهم وما إلى ذلك ...',
  },
};

export default translations;