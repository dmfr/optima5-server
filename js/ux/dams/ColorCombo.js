Ext.define('Ext.ux.dams.ColorCombo', {
	
	extend: 'Ext.ux.dams.ComboBoxCached',
	alias: 'widget.colorcombo',
	
	fieldSubTpl: [
		'<div class="ux-color-combo-wrap">',
			'<div class="{hiddenDataCls}" role="presentation"></div>',
			'<input id="{id}" data-ref="inputEl" type="{type}" role="{role}" {inputAttrTpl}',
					' size="1"', // allows inputs to fully respect CSS widths across all browsers
					'<tpl if="name"> name="{name}"</tpl>',
					'<tpl if="value"> value="{[Ext.util.Format.htmlEncode(values.value)]}"</tpl>',
					'<tpl if="placeholder"> placeholder="{placeholder}"</tpl>',
					'{%if (values.maxLength !== undefined){%} maxlength="{maxLength}"{%}%}',
					'<tpl if="readOnly"> readonly="readonly"</tpl>',
					'<tpl if="disabled"> disabled="disabled"</tpl>',
					'<tpl if="tabIdx != null"> tabindex="{tabIdx}"</tpl>',
					'<tpl if="fieldStyle"> style="{fieldStyle}"</tpl>',
			' class="{fieldCls} {typeCls} {typeCls}-{ui} {editableCls} {inputCls}" autocomplete="off"/>',
			'<div class="ux-color-combo-icon" id="{cmpId}-iconClsEl" data-ref="iconClsEl"></div>',
		'</div>',
		{
				compiled: true,
				disableFormats: true
		}
	],
	childEls: ['iconClsEl'],
	
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
					'<div class="ux-color-combo-icon {' + me.iconClsField + '}" style="',
					'<tpl if="this.hasIconUrlField()">',
						'background-image: url({' + me.iconUrlField + '});',
					'</tpl>',
					'<tpl if="this.hasIconColorField()">',
						'background-color:{' + me.iconColorField + '};',
					'</tpl>',
					'"></div>',
					'</div>',
				'</tpl>',
				{
					compiled: true,
					disableFormats: true, 
					hasIconUrlField: function() { 
						return (me.iconUrlField ? true : false) ;
					},
					hasIconColorField: function() {
						return (me.iconColorField ? true : false) ;
					}
				}
			)
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
				}
				if( this.iconClsField ) {
					var newIconCls = rec.get(this.iconClsField);
					if( this.currentIconCls ) {
						this.iconClsEl.removeCls( this.currentIconCls ) ;
					}
					this.currentIconCls = newIconCls ;
					this.iconClsEl.addCls( newIconCls ) ;
				}
				if( this.iconUrlField ) {
					var iconUrl = rec.get(this.iconUrlField);
					this.iconClsEl.dom.style.background="url(" + iconUrl + ") no-repeat center center" ;
				}
			}
			if( this.iconOnly && this.inputEl ) {
				this.inputEl.setVisible(false) ;
				//this.inputEl.dom.value = '';
			}
		} else {
			this.on('render', this.setIconCls, this, {
				single: true
			});
		}
	},
	
	updateValue: function() {
		var me = this ;
		me.callParent() ;
		me.cachedValue = me.value ;
		me.setIconCls() ;
	}
});