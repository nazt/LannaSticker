<?php

/**
 * Settings form.
 */
function lanna_settings_form() {
  $form['lanna_app_api_key'] = array(
    '#type' => 'textfield',
    '#title' => t('API key'),
    '#description' => t('Enter API Key from <a href="http://www.facebook.com/developers/apps.php">your application</a>'),
    '#default_value' => variable_get('lanna_app_api_key', ''),
  );
  $form['lanna_app_secret_key'] = array(
    '#type' => 'textfield',
    '#title' => t('Application secret'),
    '#description' => t('Enter application secret key from <a href="http://www.facebook.com/developers/apps.php">your application</a>'),
    '#default_value' => variable_get('lanna_app_secret_key', ''),
  );
  $form['lanna_image_path_directory'] = array(
    '#type' => 'textfield',
    '#title' => t('Image path directory'),
    '#description' => t('Enter image path directory.'),
    '#default_value' => variable_get('lanna_image_path_directory', CHECKIN_DEFAULT_IMAGE_PATH),
  );
  return system_settings_form($form);
} 
