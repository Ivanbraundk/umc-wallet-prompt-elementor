<?php

class UMC_Wallet_Widget extends \Elementor\Widget_Base {

    public function get_name() {
        return 'umc_wallet_prompt';
    }

    public function get_title() {
        return 'UMC Wallet Connect';
    }

    public function get_icon() {
        return 'eicon-lock-user';
    }

    public function get_categories() {
        return ['general'];
    }

    protected function _register_controls() {
        
        // Content Section
        $this->start_controls_section(
            'content_section',
            [
                'label' => 'Content',
                'tab' => \Elementor\Controls_Manager::TAB_CONTENT,
            ]
        );

        $this->add_control(
            'main_heading',
            [
                'label' => 'Main Heading',
                'type' => \Elementor\Controls_Manager::TEXT,
                'default' => 'Connect Your Wallet',
                'placeholder' => 'Enter main heading',
            ]
        );

        $this->add_control(
            'no_metamask_text',
            [
                'label' => 'No MetaMask Text',
                'type' => \Elementor\Controls_Manager::TEXT,
                'default' => 'MetaMask not detected. Install it here',
                'placeholder' => 'Text when MetaMask not found',
            ]
        );

        $this->add_control(
            'connect_wallet_text',
            [
                'label' => 'Connect Wallet Button',
                'type' => \Elementor\Controls_Manager::TEXT,
                'default' => 'Connect Wallet',
                'placeholder' => 'Connect wallet button text',
            ]
        );

        $this->add_control(
            'switch_network_text',
            [
                'label' => 'Switch Network Button',
                'type' => \Elementor\Controls_Manager::TEXT,
                'default' => 'Switch to Polygon',
                'placeholder' => 'Switch network button text',
            ]
        );

        $this->add_control(
            'connected_text',
            [
                'label' => 'Connected Text',
                'type' => \Elementor\Controls_Manager::TEXT,
                'default' => 'Wallet connected:',
                'placeholder' => 'Text when wallet connected',
            ]
        );

        $this->add_control(
            'umc_info_heading',
            [
                'label' => 'UMC Info Heading',
                'type' => \Elementor\Controls_Manager::TEXT,
                'default' => 'UMC Token Details',
                'placeholder' => 'UMC token section heading',
            ]
        );

        $this->add_control(
            'buy_umc_text',
            [
                'label' => 'Buy UMC Button',
                'type' => \Elementor\Controls_Manager::TEXT,
                'default' => 'Buy UMC Now',
                'placeholder' => 'Buy UMC button text',
            ]
        );

        $this->add_control(
            'buy_umc_url',
            [
                'label' => 'Buy UMC URL',
                'type' => \Elementor\Controls_Manager::URL,
                'default' => [
                    'url' => 'https://www.umojacoin.com/buy',
                ],
                'placeholder' => 'https://www.umojacoin.com/buy',
            ]
        );

        $this->add_control(
            'metamask_install_url',
            [
                'label' => 'MetaMask Install URL',
                'type' => \Elementor\Controls_Manager::URL,
                'default' => [
                    'url' => 'https://metamask.io/download/',
                ],
                'placeholder' => 'https://metamask.io/download/',
            ]
        );

        $this->end_controls_section();

        // Style Section
        $this->start_controls_section(
            'style_section',
            [
                'label' => 'Style',
                'tab' => \Elementor\Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_control(
            'primary_color',
            [
                'label' => 'Primary Color',
                'type' => \Elementor\Controls_Manager::COLOR,
                'default' => '#3B82F6',
            ]
        );

        $this->add_control(
            'success_color',
            [
                'label' => 'Success Color',
                'type' => \Elementor\Controls_Manager::COLOR,
                'default' => '#10B981',
            ]
        );

        $this->add_control(
            'error_color',
            [
                'label' => 'Error Color',
                'type' => \Elementor\Controls_Manager::COLOR,
                'default' => '#EF4444',
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Typography::get_type(),
            [
                'name' => 'heading_typography',
                'label' => 'Heading Typography',
                'selector' => '{{WRAPPER}} .umc-wallet-heading',
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Typography::get_type(),
            [
                'name' => 'text_typography',
                'label' => 'Text Typography',
                'selector' => '{{WRAPPER}} .umc-wallet-text',
            ]
        );

        $this->end_controls_section();
    }

    protected function render() {
        $settings = $this->get_settings_for_display();
        $widget_id = $this->get_id();
        ?>
        <div class="umc-wallet-container" 
             id="umc-wallet-<?php echo $widget_id; ?>"
             data-settings="<?php echo esc_attr(json_encode($settings)); ?>">
            
            <div class="umc-wallet-card">
                <h2 class="umc-wallet-heading"><?php echo esc_html($settings['main_heading']); ?></h2>
                
                <!-- Status Messages -->
                <div class="umc-wallet-status" id="wallet-status-<?php echo $widget_id; ?>">
                    <div class="status-item">
                        <span class="status-icon" id="metamask-status-<?php echo $widget_id; ?>">⏳</span>
                        <span class="status-text">Checking MetaMask...</span>
                    </div>
                </div>
                
                <!-- Action Buttons -->
                <div class="umc-wallet-actions" id="wallet-actions-<?php echo $widget_id; ?>">
                    <!-- Dynamic buttons will be inserted here -->
                </div>
                
                <!-- Connected Info -->
                <div class="umc-wallet-connected" id="wallet-connected-<?php echo $widget_id; ?>" style="display: none;">
                    <div class="connected-info">
                        <h3><?php echo esc_html($settings['connected_text']); ?></h3>
                        <p class="wallet-address" id="wallet-address-<?php echo $widget_id; ?>"></p>
                    </div>
                    
                    <div class="umc-token-info">
                        <h3 class="umc-wallet-heading"><?php echo esc_html($settings['umc_info_heading']); ?></h3>
                        <div class="token-details">
                            <p><strong>Symbol:</strong> UMC</p>
                            <p><strong>Contract:</strong> 0x80f2c9eD338BFcE2Bb128eCCBb9B11bbCa041A82</p>
                            <p>
                                <a href="https://polygonscan.com/token/0x80f2c9eD338BFcE2Bb128eCCBb9B11bbCa041A82" 
                                   target="_blank" rel="noopener">
                                    View on PolygonScan →
                                </a>
                            </p>
                        </div>
                        
                        <a href="<?php echo esc_url($settings['buy_umc_url']['url']); ?>" 
                           class="umc-buy-button"
                           target="_blank" rel="noopener">
                            <?php echo esc_html($settings['buy_umc_text']); ?>
                        </a>
                    </div>
                </div>
            </div>
        </div>

        <script>
        document.addEventListener('DOMContentLoaded', function() {
            if (typeof initUMCWallet === 'function') {
                initUMCWallet('<?php echo $widget_id; ?>');
            }
        });
        </script>
        <?php
    }
}