Ext.define('Ext.ux.dams.ColorCombo', {
	
	extend: 'Ext.form.field.ComboBox',
	alias: 'widget.colorcombo',    
	
	initComponent: function() {    
		var me = this;
		
		Ext.apply(me, {
			scope: me,
			tpl: Ext.create('Ext.XTemplate',
				'<tpl for=".">',
					'<div class="ux-color-combo-wrap">',
					'<div class="x-boundlist-item ux-color-combo-item ">',
					'{' + me.displayField + '}',
					'</div>',
					'<div class="ux-color-combo-icon" style="background-color:{' + me.iconColorField + '}"></div>',
					'</div>',
				'</tpl>',
				{ compiled: true, disableFormats: true }
			),
			fieldSubTpl: [
				'<div class="ux-color-combo-wrap">',
				'<div class="{hiddenDataCls}" role="presentation"></div>',
				'<input id="{id}" type="{type}" ',
						'<tpl if="size">size="{size}" </tpl>',
						'<tpl if="tabIdx">tabIndex="{tabIdx}" </tpl>',
						'class="{fieldCls} {typeCls}" autocomplete="off" />',
				'<div id="{cmpId}-triggerWrap" class="{triggerWrapCls}" role="presentation">',
						'{triggerEl}',
						'<div class="{clearCls}" role="presentation"></div>',
				'</div>',
				'<div class="ux-color-combo-icon"></div>',
				'</div>',
				{
						compiled: true,
						disableFormats: true
				}
			],
			renderSelectors: {
				iconClsEl: '.ux-color-combo-icon'
			}
		});        
		
		me.callParent(arguments);    
	},
		
	setIconCls: function() {
			if (this.rendered) {        
				var rec = this.store.findRecord(this.valueField, this.getValue());
				if (rec) {
					var newColor = rec.get(this.iconColorField);
					this.iconClsEl.dom.style.backgroundColor=newColor ;
				}
			} else {
				this.on('render', this.setIconCls, this, {
					single: true
				});
			}
	},
	
	setValue: function(value) {
			this.callParent(arguments);
			this.setIconCls();
	}     
});