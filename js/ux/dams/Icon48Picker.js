Ext.define('Icon48PickerModel',{
	extend:'Ext.data.Model',
	idProperty: 'iconIdx',
	fields:[
		{name: 'iconIdx'},
		{name: 'iconCls',type:'string'}
	]
}) ;

Ext.define('Ext.ux.dams.Icon48Picker',{
	extend:'Ext.form.field.Picker',
	alias: 'widget.damsicon48picker',
	requires: ['Ext.XTemplate','Ext.grid.Panel'], 

	fieldSubTpl:
		'<div id={id}>'+
		'<button id="{cmpId}-btnEl" type="{type}" hidefocus="true" role="button" autocomplete="off" class="ux-icon48picker">' +
			'<div id="{cmpId}-btnIconEl" class="ux-icon48picker-icon {iconCls}"></div>' +
		'</button>' +
		'</div>',
	
	isFormField: true,
	submitValue: true,
	hideTrigger: true,
	
	clsValue : '' ,
	idxValue : '' ,
	
	initComponent: function() {
		var me = this ;
		me.addChildEls('btnEl','btnIconEl');
		
		if( Ext.isObject(me.store) ) {
			var models = [] ;
			Ext.Object.each( me.store, function(k,v) {
				models.push(Ext.create('Icon48PickerModel',{
					iconIdx: k,
					iconCls: v
				}));
			},me) ;
			me.store = Ext.create('Ext.data.Store',{
				model:'Icon48PickerModel',
				data:models
			});
		}
		else if( Ext.isArray(me.store) ) {
			var models = [] ;
			Ext.Array.each( me.store, function(v) {
				models.push(Ext.create('Icon48PickerModel',{
					iconIdx: v,
					iconCls: v
				}));
			},me) ;
			me.store = Ext.create('Ext.data.Store',{
				model:'Icon48PickerModel',
				data:models
			});
		}
		
		me.callParent() ;
	},
	
	initTrigger: function() {
		var me = this,
			btnEl = me.btnEl ;
			
		me.mon(me.btnEl, 'click', me.onTriggerClick, me);
	},
	createPicker: function() {
		var me = this ;
		
		return Ext.create('Ext.panel.Panel',{
			height: 200,
			width: 200,
			renderTo: Ext.getBody(),
			layout:'fit',
			autoScroll:true,
			items:[{
				xtype:'dataview',
				store: me.store,
				tpl:[
					'<tpl for=".">',
						'<div class="ux-icon48picker-thumb-box {iconCls}">',
						'</div>',
					'</tpl>',
					'<div class="x-clear"></div>'
				],
				trackOver: true,
				overItemCls: 'x-item-over',
				itemSelector: 'div.ux-icon48picker-thumb-box',
				listeners:{
					itemclick:me.onItemClick,
					scope:me
				}
			}],
			floating: true,
			hidden: true,
			focusOnShow: true,
			ownerCt: me.ownerCt,
			pickerField: me
		}); 
	},
	alignPicker: function() {
		var me = this,
				picker;

		if (me.isExpanded) {
			picker = me.getPicker();
			if (picker.isFloating()) {
				me.doAlign();
			}
		}
	},
	
	onItemClick: function( picker, record ) {
		var me = this ;
		var oldValue = me.idxValue ;
		me.idxValue = record.getId() ;
		me.renderValue() ;
		me.clearInvalid();
		this.fireEvent('change',me,me.idxValue,oldValue) ;
		me.collapse() ;
	},
	
	
	getRawValue: function() {
		var me = this ;
		return me.idxValue ;
	},
	setRawValue: function( idxValue ) {
		var me = this ;
		if( idxValue==null ) {
			idxValue = '' ;
		}
		me.idxValue = idxValue ;
		
		if( !me.rendered ) {
			me.on('afterrender',function() {
				me.renderValue() ;
			},me,{single:true}) ;
			return ;
		}
		
		me.renderValue() ;
	},
	renderValue: function() {
		var me = this ;
		
		if( me.clsValue != '' ) {
			me.btnIconEl.removeCls(me.clsValue) ;
		}
		me.clsValue = '' ;
		
		var record = me.store.getById(me.idxValue) ;
		if( record == null ) {
			return ;
		}
		me.clsValue = record.get('iconCls') ;
		me.btnIconEl.addCls(me.clsValue) ;
	},
	getSubmitData: function() {
		var value = this.getValue() ;
		var data = {} ;
		data[this.getName()] = value ;
		return data ;
	},
	
	
	markInvalid: function( arrErrors ) {
		var me = this;
		me.btnEl.addCls(me.invalidCls + '-field');
	},
	clearInvalid: function( arrErrors ) {
		var me = this;
		me.btnEl.removeCls(me.invalidCls + '-field');
	}
}) ;