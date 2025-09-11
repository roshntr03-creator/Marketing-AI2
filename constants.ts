import { type Tool } from './types.ts';

/**
 * Defines all the available marketing tools in the application.
 * This centralized constant makes it easy to manage and extend the toolset.
 */
export const TOOLS: Tool[] = [
  // Category: Audience Growth & Strategy
  {
    id: 'seo_assistant',
    nameKey: 'seo_assistant_name',
    descriptionKey: 'seo_assistant_desc',
    icon: 'fa-solid fa-magnifying-glass-chart',
    categoryKey: 'audience_growth_strategy',
    inputs: [
      { name: 'topic', type: 'text', labelKey: 'topic_label', placeholderKey: 'seo_placeholder' },
    ],
  },
  {
    id: 'influencer_discovery',
    nameKey: 'influencer_discovery_name',
    descriptionKey: 'influencer_discovery_desc',
    icon: 'fa-solid fa-users-rays',
    categoryKey: 'audience_growth_strategy',
    inputs: [
      { name: 'city', type: 'text', labelKey: 'city_label', placeholderKey: 'city_placeholder' },
      { name: 'field', type: 'text', labelKey: 'field_label', placeholderKey: 'field_placeholder' },
    ],
  },
  {
    id: 'social_media_optimizer',
    nameKey: 'social_media_optimizer_name',
    descriptionKey: 'social_media_optimizer_desc',
    icon: 'fa-solid fa-arrow-trend-up',
    categoryKey: 'audience_growth_strategy',
    inputs: [
      { name: 'field', type: 'text', labelKey: 'your_industry_label', placeholderKey: 'industry_placeholder' },
    ],
  },
  // Category: Creative Content Generation
  {
    id: 'video_script_assistant',
    nameKey: 'video_script_assistant_name',
    descriptionKey: 'video_script_assistant_desc',
    icon: 'fa-solid fa-clapperboard',
    categoryKey: 'content_creation',
    inputs: [
      { name: 'idea', type: 'textarea', labelKey: 'video_idea_label', placeholderKey: 'video_idea_placeholder' },
    ],
  },
  {
    id: 'short_form_factory',
    nameKey: 'short_form_factory_name',
    descriptionKey: 'short_form_factory_desc',
    icon: 'fa-solid fa-wand-magic-sparkles',
    categoryKey: 'content_creation',
    inputs: [
        { name: 'source_text', type: 'textarea', labelKey: 'long_form_content_label', placeholderKey: 'long_form_content_placeholder' },
        { name: 'image', type: 'image', labelKey: 'or_upload_product_image_label', placeholderKey: '' },
    ],
  },
  {
    id: 'smm_content_plan',
    nameKey: 'smm_content_plan_name',
    descriptionKey: 'smm_content_plan_desc',
    icon: 'fa-solid fa-calendar-week',
    categoryKey: 'content_creation',
    inputs: [
      { name: 'platform', type: 'text', labelKey: 'platform_label', placeholderKey: 'platform_placeholder' },
      { name: 'topic', type: 'text', labelKey: 'topic_label', placeholderKey: 'smm_topic_placeholder' },
    ],
  },
  {
    id: 'video_generator',
    nameKey: 'ai_video_generator_name',
    descriptionKey: 'ai_video_generator_desc',
    icon: 'fa-solid fa-film',
    categoryKey: 'content_creation',
    inputs: [
      { name: 'prompt', type: 'textarea', labelKey: 'video_idea_label', placeholderKey: 'video_generator_placeholder' },
    ],
  },
  // Category: Campaign & Outreach
  {
    id: 'ads_ai_assistant',
    nameKey: 'ads_ai_assistant_name',
    descriptionKey: 'ads_ai_assistant_desc',
    icon: 'fa-solid fa-bullhorn',
    categoryKey: 'campaign_management',
    inputs: [
      { name: 'product', type: 'textarea', labelKey: 'product_description_label', placeholderKey: 'product_description_placeholder' },
      { name: 'audience', type: 'text', labelKey: 'target_audience_label', placeholderKey: 'target_audience_placeholder' },
    ],
  },
  {
    id: 'email_marketing',
    nameKey: 'email_marketing_name',
    descriptionKey: 'email_marketing_desc',
    icon: 'fa-solid fa-envelope-open-text',
    categoryKey: 'campaign_management',
    inputs: [
      { name: 'goal', type: 'textarea', labelKey: 'campaign_goal_label', placeholderKey: 'campaign_goal_placeholder' },
    ],
  },
  {
    id: 'customer_persona',
    nameKey: 'customer_persona_name',
    descriptionKey: 'customer_persona_desc',
    icon: 'fa-solid fa-user-astronaut',
    categoryKey: 'campaign_management',
    inputs: [
      { name: 'product_service', type: 'textarea', labelKey: 'product_service_label', placeholderKey: 'product_service_placeholder' },
      { name: 'target_audience_details', type: 'textarea', labelKey: 'target_audience_details_label', placeholderKey: 'target_audience_details_placeholder' },
    ],
  },
];
