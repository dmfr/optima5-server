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
			),
			fieldSubTpl: [
				'<div class="ux-color-combo-wrap">',
				'<div class="{hiddenDataCls}" role="presentation"></div>',
					'<input id="{id}" type="{type}" {inputAttrTpl} class="{fieldCls} {typeCls}" autocomplete="off"',
						'<tpl if="value"> value="{[Ext.util.Format.htmlEncode(values.value)]}"</tpl>',
						'<tpl if="name"> name="{name}"</tpl>',
						'<tpl if="placeholder"> placeholder="{placeholder}"</tpl>',
						'<tpl if="size"> size="{size}"</tpl>',
						'<tpl if="maxLength !== undefined"> maxlength="{maxLength}"</tpl>',
						'<tpl if="readOnly"> readonly="readonly"</tpl>',
						'<tpl if="disabled"> disabled="disabled"</tpl>',
						'<tpl if="tabIdx"> tabIndex="{tabIdx}"</tpl>',
						'<tpl if="fieldStyle"> style="{fieldStyle}"</tpl>',
					'/>',
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
		me.store.on('datachanged',function(){
			me.onStoreLoadData() ;
		},me);
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
	},
	
	onStoreLoadData: function() {
		var me = this ;
		me.setValue( me.cachedValue ) ;
	}
});