Ext.define('Ext.ux.dams.FieldSet',{
	extend:'Ext.form.FieldSet',
	alias: 'widget.damsfieldset',
	
	initComponent: function() {
		this.callParent() ;
		this.addCls(this.baseCls + '-withicon') ;
		this.addEvents('iconclick') ;
	},
    createLegendCt: function () {
        var me = this,
            items = [],
            legend = {
                xtype: 'container',
                baseCls: me.baseCls + '-header',
                id: me.id + '-legend',
                autoEl: 'legend',
                ariaRole: null,
                ariaLabelledBy: '.' + me.baseCls + '-header-text',
                items: items,
                ownerCt: me,
                shrinkWrap: true,
                ownerLayout: me.componentLayout
            };

        // Checkbox
        if (me.checkboxToggle) {
            items.push(me.createCheckboxCmp());
        } else if (me.collapsible) {
            // Toggle button
            items.push(me.createToggleCmp());
        }

        // Icon
        items.push(me.createIconCmp());
        // Title
        items.push(me.createTitleCmp());

        return legend;
    },
    createIconCmp: function() {
        var me  = this,
            cfg = {
                xtype : 'component',
                html  : '&#160;',
                cls   : me.baseCls + '-header-icon',
                id    : me.id + '-legendIcon'
            };

        if (true) {
            cfg.listeners = {
                el : {
                    scope : me,
                    click : me.iconClick
                }
            };
            cfg.cls += ' ' + me.iconCls;
        }

        return (me.iconCmp = Ext.widget(cfg));
    },
	 iconClick: function(e) {
		 this.fireEvent('iconclick',this,e) ;
	 }
	 
});