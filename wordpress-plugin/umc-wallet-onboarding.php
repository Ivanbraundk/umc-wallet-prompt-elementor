<?php
/**
 * Plugin Name: UMC Wallet Onboarding Prompt
 * Plugin URI: https://www.umojacoin.com
 * Description: A WordPress plugin that integrates directly into Elementor as a visible, drag-and-drop widget, allowing full editing of wallet onboarding UI elements while handling MetaMask, Polygon, and UMC logic.
 * Version: 1.05
 * Author: UMC Tech Ltd
 * Author URI: https://www.umojacoin.com
 * Text Domain: umc-wallet
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('UMC_WALLET_URL', plugin_dir_url(__FILE__));
define('UMC_WALLET_PATH', plugin_dir_path(__FILE__));

class UMC_Wallet_Onboarding {
    
    public function __construct() {
        add_action('plugins_loaded', [$this, 'init']);
    }
    
    public function init() {
        // Check if Elementor is active
        if (!did_action('elementor/loaded')) {
            add_action('admin_notices', [$this, 'admin_notice_missing_elementor']);
            return;
        }
        
        // Add Elementor widget
        add_action('elementor/widgets/widgets_registered', [$this, 'register_widgets']);
        
        // Enqueue scripts
        add_action('wp_enqueue_scripts', [$this, 'enqueue_scripts']);
    }
    
    public function admin_notice_missing_elementor() {
        echo '<div class="notice notice-warning is-dismissible">';
        echo '<p><strong>UMC Wallet Onboarding</strong> requires Elementor to be installed and activated.</p>';
        echo '</div>';
    }
    
    public function register_widgets() {
        require_once UMC_WALLET_PATH . 'widgets/umc-wallet-widget.php';
        \Elementor\Plugin::instance()->widgets_manager->register_widget_type(new \UMC_Wallet_Widget());
    }
    
    public function enqueue_scripts() {
        wp_enqueue_script(
            'ethers-js',
            'https://cdn.ethers.io/lib/ethers-5.7.2.umd.min.js',
            [],
            '5.7.2',
            true
        );
        
        wp_enqueue_script(
            'umc-wallet-js',
            UMC_WALLET_URL . 'assets/js/wallet.js',
            ['ethers-js'],
            '1.05',
            true
        );
        
        wp_enqueue_style(
            'umc-wallet-css',
            UMC_WALLET_URL . 'assets/css/wallet.css',
            [],
            '1.05'
        );
    }
}

new UMC_Wallet_Onboarding();