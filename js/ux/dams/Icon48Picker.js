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
		'<button id="{cmpId}-btnEl" type="{type}" hidefocus="true" role="button" autocomplete="off" class="ux-icon48picker">' +
			'<div id="{cmpId}-btnIconEl" class="ux-icon48picker-icon {iconCls}"></div>' +
		'</button>' +
		'<div id="{id}" type="{type}"></div>' +
		'<div id="{cmpId}-triggerWrap" class="{triggerWrapCls}" role="presentation">' +
			//'{triggerEl}' +
		'</div>',
	
	isFormField: true,
	submitValue: true,
	
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
		console.log('created!!') ;
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
		me.setValueRendered() ;
		this.fireEvent('change',me,me.idxValue,oldValue) ;
		me.collapse() ;
	},
	
	
	setValue: function( idxValue ) {
		var me = this ;
		
		me.idxValue = idxValue ;
		
		if( !me.rendered ) {
			me.on('afterrender',function() {
				me.setValueRendered() ;
			},me,{single:true}) ;
			return ;
		}
		
		me.setValueRendered() ;
	},
	setValueRendered: function() {
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
	getValue: function() {
		var me = this ;
		return me.idxValue ;
	},
	getSubmitData: function() {
		var value = this.getValue() ;
		var data = {} ;
		data[this.getName()] = value ;
		return data ;
	}
}) ;