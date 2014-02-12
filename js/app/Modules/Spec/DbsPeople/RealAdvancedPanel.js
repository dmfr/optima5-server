Ext.define('DbsPeopleRhRealAdvModel',{
	extend: 'Ext.data.Model',
	fields:[
		{name:'class', type:'string'},
		{name:'code', type:'string'},
		{name:'length_hours', type:'int'}
	]
}) ;

Ext.define('Optima5.Modules.Spec.DbsPeople.RealAdvancedPanel',{
	extend:'Ext.panel.Panel',
	requires:[
		'Ext.ux.dams.ColorCombo',
		'Ext.ux.dams.ComboBoxCached'
	],

	initComponent: function() {
		var me = this ;
		me.addEvents('proceed') ;
		
		if( (me.parentRealPanel) instanceof Optima5.Modules.Spec.DbsPeople.RealPanel ) {} else {
			Optima5.Helper.logError('Spec:DbsPeople:RealAdvancedPanel','No parent reference ?') ;
		}
		if( (me.remoteDataRecord) ) {} else {
			Optima5.Helper.logError('Spec:DbsPeople:RealAdvancedPanel','No remoteDataRecord instance ?') ;
		}
		
		var storeData = [],
			slices = me.remoteDataRecord.slices,
			slice ;
		for( var idx=0 ; idx<slices.length ; idx++ ) {
			slice = slices[idx] ;
			
			if( slice.whse_is_alt ) {
				storeData.push({
					class:'WHSE',
					code:slice.whse_code,
					length_hours: slice.length_hours
				});
			} else {
				storeData.push({
					class:'ROLE',
					code:slice.role_code,
					length_hours: slice.length_hours
				});
			}
		}
		
		Ext.apply(me,{
			layout: {
				type:'vbox',
				align:'stretch'
			},
			items: [{
				xtype: 'form',
				border: false,
				height: 60,
				bodyPadding: 5,
				bodyCls: 'ux-noframe-bg',
				layout:'hbox',
				items:[{
					xtype:'fieldcontainer',
					flex: 3,
					layout: 'anchor',
					defaults: {
						labelAlign: 'left',
						labelWidth: 50,
						anchor: '100%',
						margin: 1,
					},
					items: [{
						xtype:'displayfield',
						fieldLabel: 'Nom',
						value: '<b>' + me.remoteDataRecord.people_name + '</b>'
					},{
						xtype:'displayfield',
						fieldLabel: 'Date',
						value: '<b>' + Ext.Date.format( Ext.Date.parse(me.remoteDataRecord.date_sql,'Y-m-d'), 'd/m/Y') + '</b>'
					}]
				},{
					xtype:'fieldcontainer',
					flex: 1,
					margin: 10,
					layout: 'anchor',
					defaults: {
						labelAlign: 'left',
						labelWidth: 50,
						anchor: '100%',
						margin: 1,
					},
					items: [{
						xtype:'checkbox',
						boxLabel: 'Absent',
						checked: false
					}]
				}]
			},{
				xtype:'grid',
				flex:1,
				columns:[{
					text:'Type',
					dataIndex: 'class',
					width: 50,
					renderer: function( value, metaData, record ) {
						//return value ;
						switch( record.get('class') ) {
							case 'ROLE' :
								metaData.tdCls = 'op5-spec-dbspeople-icon-role' ;
								break ;
							case 'WHSE' :
								metaData.tdCls = 'op5-spec-dbspeople-icon-move' ;
								break ;
							default :
								return value ;
						}
						return '' ;
					},
					editor:{
						xtype:'component',
						width: 50,
						//height: '100%',
						getValue: Ext.emptyFn,
						tpl:[
							'<div class="{iconCls}">&#160;</div>'
						]
					}
				},{
					text:'Role/Warehouse',
					dataIndex: 'code',
					flex: 1,
					editor:{
						xtype:'combobox',
						matchFieldWidth:false,
						listConfig:{width:200},
						forceSelection:true,
						allowBlank:false,
						editable:false,
						queryMode: 'local',
						displayField: 'text',
						valueField: 'id',
						store: {
							fields:['id','text'],
							data: []
						}
					},
					renderer: function( value, metaData, record ) {
						//return value ;
						switch( record.get('class') ) {
							case 'ROLE' :
								return me.parentRealPanel.helperGetRoleTxt( value ) ;
								break ;
							case 'WHSE' :
								return me.parentRealPanel.helperGetWhseTxt( value ) ;
								break ;
							default :
								return value ;
						}
						return '' ;
					}
				},{
					text:'Length',
					dataIndex: 'length_hours',
					width: 50,
					editor:{
						xtype: 'numberfield'
					},
					renderer: function( value ) {
						if( value > 0 ) {
							return value + ' h' ;
						}
					}
				}],
				store: {
					model:'DbsPeopleRhRealAdvModel',
					data: storeData,
					proxy: Ext.create('Ext.data.proxy.Memory',{
						updateOperation: function(operation, callback, scope) {
							operation.setCompleted();
							operation.setSuccessful();
							Ext.callback(callback, scope || me, [operation]);
						}
					})
				},
				selModel: {
					listeners: {
						selectionchange: function(selModel, selections) {
							this.child('grid').down('#delete').setDisabled(selections.length === 0);
						},
						scope: me
					}
				},
				plugins: [{
					ptype:'rowediting',
					pluginId: 'rowediting',
					listeners: {
						canceledit: function(editor,editEvent) {
							var grid = editEvent.grid,
								record = editEvent.record,
								store = grid.getStore() ;
							
							if( record.get('code') == null || record.get('code') == '' ) {
								store.remove(record) ;
							}
							store.sync() ;
						},
						beforeedit: function(editor,editEvent) {
							var grid = editEvent.grid,
								record = editEvent.record,
								columns = grid.child('headercontainer').query('gridcolumn') ;
							
							switch( record.get('class') ) {
								case 'ROLE' :
									columns[0].getEditor().update({iconCls:'op5-spec-dbspeople-icon-role'}) ;
									columns[1].getEditor().getStore().loadData( me.parentRealPanel.devCfgData.ROLE ) ;
									break ;
								case 'WHSE' :
									columns[0].getEditor().update({iconCls:'op5-spec-dbspeople-icon-move'}) ;
									columns[1].getEditor().getStore().loadData( me.parentRealPanel.devCfgData.WHSE ) ;
									break ;
							}
						},
						edit: function(editor,editEvent) {
							
						},
						scope:me
					}
				}],
				dockedItems: [{
					xtype: 'toolbar',
					items: [{
						itemId: 'add',
						text: 'Add',
						iconCls: 'icon-add',
						menu: [{
							iconCls: 'op5-spec-dbspeople-icon-role',
							text: 'Rôle',
							handler: function(btn) {
								this.onBtnAdd('ROLE') ;
							},
							scope: this
						},{
							iconCls: 'op5-spec-dbspeople-icon-move',
							text: 'Transfert',
							handler: function(btn) {
								this.onBtnAdd('WHSE') ;
							},
							scope: this
						}]
					}, '-', {
						itemId: 'delete',
						text: 'Delete',
						iconCls: 'icon-delete',
						disabled: true,
						handler: function(){
							this.onBtnDelete() ;
						},
						scope: this
					}]
				}]
			}]
		});
		
		this.callParent() ;
	},
	calcLayout: function() {
		var me = this,
			form = this.getForm() ;
		return ;
		if( form.getValues()['promotion_class'] == 'PROD' ) {
			form.findField('brand_code').setValue('WONDERFUL') ;
			form.findField('brand_code').setVisible(false) ;
		} else {
			form.findField('brand_code').clearValue() ;
			form.findField('brand_code').setVisible(true) ;
		}
	},
	
	onBtnAdd: function( tClass ) {
		var me = this,
			grid = me.child('grid'),
			store = grid.getStore() ;
		
		var newRecordIndex = 0 ;
		
		store.insert(newRecordIndex, Ext.create('DbsPeopleRhRealAdvModel',{class:tClass} ) );
		store.sync() ;
		
		grid.getPlugin('rowediting').startEdit(newRecordIndex, 0);
	},
	onBtnDelete: function() {
		var me = this,
			grid = me.child('grid'),
			store = grid.getStore() ;
		var selection = grid.getView().getSelectionModel().getSelection()[0];
		if (selection) {
			store.remove(selection);
			store.sync() ;
		}
	},
	
	doSave: function() {
		var me = this ;
		// Store back !!
		if( this.query('checkbox')[0].getValue() == true ) {
			console.log('absent!') ;
			me.remoteDataRecord.missing = true ;
			me.remoteDataRecord.slices = [] ;
		} else {
			me.remoteDataRecord.missing = false ;
			if( this.child('grid').getStore().getCount() == 0 ) {
				me.remoteDataRecord.slices = [{role_code:me.remoteDataRecord.std_role_code, length_hours:me.remoteDataRecord.std_length_hours}] ;
			} else {
				var slices = [] ;
				this.child('grid').getStore().each( function(rec){
					switch( rec.get('class') ) {
						case 'ROLE' :
							slices.push({role_code:rec.get('code'), length_hours:rec.get('length_hours')}) ;
							break ;
						case 'WHSE' :
							slices.push({whse_is_alt:true, whse_code:rec.get('code'), length_hours:rec.get('length_hours')}) ;
					}
				}) ;
				me.remoteDataRecord.slices = slices ;
			}
		}
	}
	
	
});