/*
 * * From : 
 * http://www.sencha.com/forum/showthread.php?83213-Add-new-tab-button-in-tab-strip
 * http://www.sencha.com/forum/showthread.php?271882-Ext.ux.AddTabButton-plugin&p=996340#post996340
 */

Ext.define('Ext.ux.AddTabButton', { 
    alias: 'plugin.AddTabButton', 
    extend: 'Ext.AbstractPlugin', 

    // start defaults 
    toolTip: 'Add Tab',     // add btn ToolTip 
    iconCls: null,          // add btn icon class 
    btnText: '+',           // add btn text, button text is not use if iconCls is set 
    forceText: false,       // use the btnText even if an icon is used 

    panelConfig: {              // default config for new added panel 
        xtype: 'panel', 
        title: 'New Tab', 
        closable: true, 
        hidden: false 
    }, 
    // end defaults 

    constructor: function(config){ 
        this.panelConfig = Ext.apply(this.panelConfig, config.tabConfig || {}); 
        this.callParent(arguments); 
    }, 

    /** 
     * @param tabPanel 
     */ 
    init: function(tabPanel){ 
        var me = this; 

        // set tabPanel global 
        me.tabPanel = tabPanel; 

        if(tabPanel instanceof Ext.TabPanel){ 
            // add add btn tab to the TabBar 
            me.btn = me.tabPanel.getTabBar().add({ 
                xtype: 'tab', 
                minWidth: 25, 
                text: me.iconCls && !me.forceText ? '' : me.btnText, // if icon is used remove text 
                iconCls: me.iconCls, 
                tooltip: me.toolTip, 
                handler: me.onAddTabClick, 
                closable: false, 
                scope: me 
            }); 

            // fix the tab margin and padding 
            me.btn.on('render', function(){ 
                if(me.iconCls && !me.forceText){ 
                    var style; 
                    if(me.tabPanel.tabPosition == 'top'){ 
                        style = 'margin: 0 0 3px 0; padding: 0'; 
                    } else if(me.tabPanel.tabPosition == 'bottom'){ 
                        style = 'margin: 3px 0 0 0; padding: 0'; 
                    } 
                    me.btn.btnWrap.applyStyles(style); 
                } 
            }); 
        } 
    }, 

    /** 
     *  Adds new Tab to TabPanel 
     */ 
    onAddTabClick: function(){ 
        var tab = this.tabPanel.add(this.panelConfig); 
        this.tabPanel.setActiveTab(tab); 
    }, 

    /** 
     * disable or enable the Add button 
     * @param value 
     */ 
    setDisabled: function(value){ 
        this.btn.setDisabled(value); 
    }, 

    /** 
     * hide or show the Add button 
     * @param value 
     */ 
    setVisible: function(value){ 
        this.btn.setVisible(value); 
    } 
});   
