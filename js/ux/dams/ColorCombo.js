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
					'<div class="ux-color-combo-icon {' + me.iconClsField + '}" style="background-color:{' + me.iconColorField + '}"></div>',
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
				if( this.iconColorField ) {
					var newColor = rec.get(this.iconColorField);
					this.iconClsEl.dom.style.backgroundColor=newColor ;
					//this.iconClsEl.dom.style.background = "url('images/op5img/ico_cancel_small.gif') no-repeat center center" ;
				}
				if( this.iconClsField ) {
					var newIconCls = rec.get(this.iconClsField);
					if( this.currentIconCls ) {
						this.iconClsEl.removeCls( this.currentIconCls ) ;
					}
					this.currentIconCls = newIconCls ;
					this.iconClsEl.addCls( newIconCls ) ;
				}
			}
		} else {
			this.on('render', this.setIconCls, this, {
				single: true
			});
		}
	},
	
	setValue: function(value) {
		var me = this ;
		
		value = Ext.Array.from(value);
		if( value.length == 1 ) {
			var record = value[0];
			// record found, select it.
			if(record.isModel) {
				me.cachedValue = record.get(me.valueField) ;
			}
			else {
				me.cachedValue = record ;
			}
		}
		else if(value.length == 0 ) {
			me.cachedValue = null ;
		}
		
		me.callParent(arguments);
		me.setIconCls();
		if( me.iconOnly && me.inputEl ) {
			me.inputEl.dom.value = '';
		}
	},
	getValue: function() {
		var me = this ;
		return me.cachedValue ;
	}
});