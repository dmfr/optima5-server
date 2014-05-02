Ext.define('DbsPeopleRhRealAdvModel',{
	extend: 'Ext.data.Model',
	fields:[
		{name:'readonly', type:'boolean'},
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
		
		if( (me.parentRealPanel) instanceof Optima5.Modules.Spec.DbsPeople.RealPanel ) {} else {
			Optima5.Helper.logError('Spec:DbsPeople:RealAdvancedPanel','No parent reference ?') ;
		}
		if( (me.peopledayRecord) ) {} else {
			Optima5.Helper.logError('Spec:DbsPeople:RealAdvancedPanel','No peopledayRecord instance ?') ;
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
						value: '<b>' + me.peopledayRecord.get('people_name') + '</b>'
					},{
						xtype:'displayfield',
						fieldLabel: 'Date',
						value: '<b>' + Ext.Date.format( Ext.Date.parse(me.peopledayRecord.get('date_sql'),'Y-m-d'), 'd/m/Y') + '</b>'
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
						itemId: 'absCheckbox',
						boxLabel: 'Absent',
						listeners: {
							change: function() {
								this.calcLayout() ;
							},
							scope: this
						}
					}]
				}]
			},{
				xtype:'form',
				flex:1,
				bodyPadding: 5,
				bodyCls: 'ux-noframe-bg',
				itemId: 'absPanel',
				hidden: true,
				frame: true,
				border: true,
				margin: '4px',
				title: 'Réservé au service RH',
				items: [{
					xtype:'combobox',
					itemId: 'absCombobox',
					matchFieldWidth:false,
					listConfig:{width:200},
					forceSelection:true,
					allowBlank:false,
					editable:false,
					queryMode: 'local',
					displayField: 'text',
					valueField: 'id',
					fieldLabel: 'Motif',
					name: 'rh_abs_code' ,
					store: {
						fields:['id','text'],
						data: Optima5.Modules.Spec.DbsPeople.HelperCache.forTypeGetAll("ABS")
					}
				},{
					xtype: 'fieldset',
					title: 'Validation RH',
					defaults: {
						labelAlign: 'left',
						labelWidth: 70,
						anchor: '100%'
					},
					items:[{
						xtype:'checkbox',
						name: 'rh_abs_is_on' ,
						boxLabel: 'Absent',
						listeners: {
							change: function() {
								this.calcLayout() ;
							},
							scope: this
						}
					},{
						xtype: 'datefield',
						allowBlank: false,
						format: 'd/m/Y',
						submitFormat: 'Y-m-d',
						fieldLabel: 'Début',
						name: 'rh_abs_date_start',
						anchor: '',
						width: 170
					},{
						xtype: 'datefield',
						allowBlank: false,
						format: 'd/m/Y',
						submitFormat: 'Y-m-d',
						fieldLabel: 'Fin',
						name: 'rh_abs_date_end',
						anchor: '',
						width: 170
					}]
				}]
			},{
				xtype:'grid',
				itemId: 'slicesPanel',
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
						xtype: 'numberfield',
						validator: function(v) {
							if( Ext.isEmpty(v) ) {
								return false ;
							}
							return ( v > 0 ) ;
						}
					},
					renderer: function( value ) {
						if( value > 0 ) {
							return value + ' h' ;
						}
					}
				}],
				store: {
					model:'DbsPeopleRhRealAdvModel',
					data: [],
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
							
							if( record.get('readonly') == true ) {
								return false ;
							}
								
							switch( record.get('class') ) {
								case 'ROLE' :
									columns[0].getEditor().update({iconCls:'op5-spec-dbspeople-icon-role'}) ;
									columns[1].getEditor().getStore().loadData( Optima5.Modules.Spec.DbsPeople.HelperCache.forTypeGetAll("ROLE") ) ;
									break ;
								case 'WHSE' :
									columns[0].getEditor().update({iconCls:'op5-spec-dbspeople-icon-move'}) ;
									columns[1].getEditor().getStore().loadData( Optima5.Modules.Spec.DbsPeople.HelperCache.forTypeGetAll("WHSE") ) ;
									break ;
							}
						},
						edit: function(editor,editEvent) {
							var grid = editEvent.grid,
								store = grid.getStore() ;
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
							itemId: 'btnItemRole',
							iconCls: 'op5-spec-dbspeople-icon-role',
							text: 'Rôle',
							handler: function(btn) {
								this.onBtnAdd('ROLE') ;
							},
							scope: this
						},{
							itemId: 'btnItemMove',
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
		this.doLoad() ;
	},
	calcLayout: function() {
		var me = this,
			absCheckbox = this.down('#absCheckbox'),
			absPanel = this.down('#absPanel'),
			slicesPanel = this.down('#slicesPanel') ;
		
		absPanel.setVisible(absCheckbox.getValue()) ;
		slicesPanel.setVisible(!absCheckbox.getValue()) ;
		
		var rhAbsIsOn = absPanel.getForm().findField('rh_abs_is_on'),
			rhAbsDateStart = absPanel.getForm().findField('rh_abs_date_start'),
			rhAbsDateEnd = absPanel.getForm().findField('rh_abs_date_end') ;
		rhAbsDateStart.setVisible(rhAbsIsOn.getValue());
		rhAbsDateEnd.setVisible(rhAbsIsOn.getValue());
		
		return ;
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
	
	
	doLoad: function() {
		var me = this,
			absCheckbox = this.down('#absCheckbox'),
			absCombobox = this.down('#absCombobox'),
			slicesPanel = this.down('#slicesPanel'),
			toolbar = this.down('toolbar'),
			btnItemMove = toolbar.down('#btnItemMove'),
			btnItemRole = toolbar.down('#btnItemRole') ;
		
		var storeData = [],
			gridWhse = me.gridRecord.get('whse_code'),
			stdWhse = me.peopledayRecord.get('std_whse_code'),
			altWhse = ( stdWhse != gridWhse ? gridWhse : null ),
			absMode, absCode,
			slices = Ext.pluck( me.peopledayRecord.works().getRange(), 'data' ),
			slice ;
		if( me.peopledayRecord.abs().getCount() > 0 ) {
			absMode = true ;
			absCode = me.peopledayRecord.abs().getAt(0).data.abs_code ;
		}
		
		var altWhsesObj = {} ;
		for( var idx=0 ; idx<slices.length ; idx++ ) {
			slice = slices[idx] ;
			
			if( altWhse != null ) {
				if( slice.alt_whse_code==altWhse ) {
					storeData.push({
						class:'ROLE',
						code:slice.role_code,
						length_hours: slice.role_length
					});
				}
				continue ;
			}
			
			if( !Ext.isEmpty(slice.alt_whse_code) ) {
				if( typeof altWhsesObj[slice.alt_whse_code] === 'undefined' ) {
					altWhsesObj[slice.alt_whse_code] = 0 ;
				}
				altWhsesObj[slice.alt_whse_code] += slice.role_length ;
				continue ;
			}
			storeData.push({
				class:'ROLE',
				code:slice.role_code,
				length_hours: slice.role_length
			});
		}
		Ext.Object.each( altWhsesObj, function( altWhseCode, length ) {
			storeData.push({
				readonly: true,
				class:'WHSE',
				code:altWhseCode,
				length_hours: length
			});
		}) ;
		
		// Set UI
		absCheckbox.setVisible( altWhse==null && me.peopledayRecord.data.std_daylength > 0 ) ;
		absCheckbox.setValue( absMode ) ;
		absCombobox.setValue( absCode ) ;
		slicesPanel.getStore().loadRawData( storeData ) ;
		btnItemRole.setVisible(true);
		btnItemMove.setVisible( altWhse==null );
		me.calcLayout() ;
	},
	doSave: function() {
		var me = this ;
			
		var gridWhse = me.gridRecord.get('whse_code'),
			stdWhse = me.peopledayRecord.get('std_whse_code'),
			altWhse = ( stdWhse != gridWhse ? gridWhse : null );
			
		var recordWorksStore = me.peopledayRecord.works(),
			recordAbsStore = me.peopledayRecord.abs() ;
			
		var localStore = this.child('grid').getStore() ;
			
		if( altWhse != null ) { // ****** Mode autre warehouse *********
			recordAbsStore.removeAll() ;
			
			// Remove all "this" warehouse works
			var worksTodelete = [] ;
			recordWorksStore.each( function(workRecord) {
				if( !Ext.isEmpty(workRecord.get('alt_whse_code')) && (workRecord.get('alt_whse_code') == altWhse) ) {
					worksTodelete.push(workRecord) ;
				}
			}) ;
			recordWorksStore.remove(worksTodelete) ;
			
			// Store work slices
			if( localStore.getCount() == 0 ) {
				recordWorksStore.add({
					alt_whse_code: altWhse,
					role_code: me.peopledayRecord.data.std_role_code,
					role_length: me.peopledayRecord.data.std_daylength
				}) ;
			} else {
				var slices = [] ;
				localStore.each( function(rec){
					if( rec.get('class') != 'ROLE' ) {
						return ;
					}
					slices.push({
						alt_whse_code: altWhse,
						role_code:rec.get('code'),
						role_length:rec.get('length_hours')
					}) ;
				}) ;
				recordWorksStore.add(slices) ;
			}
		} else if( this.query('checkbox')[0].getValue() == true ) {  // ********* Mode absence *********
			var absCode = this.down('#absPanel').down('combobox').getValue() ;
			recordWorksStore.removeAll() ;
			recordAbsStore.removeAll() ;
			recordAbsStore.add({abs_code:absCode, abs_length:me.peopledayRecord.data.std_daylength}) ;
			
		} else { // ********* Mode standard (master) *********
			recordAbsStore.removeAll() ;
			if( localStore.getCount() == 0 ) {
				recordWorksStore.removeAll() ;
				if( me.peopledayRecord.data.std_daylength > 0 ) {
					recordWorksStore.add({
						role_code:me.peopledayRecord.data.std_role_code,
						role_length:me.peopledayRecord.data.std_daylength
					}) ;
				}
			} else {
				var worksTodelete = [] ;
				
				var slices = [], keepAltWhses = false ;
				localStore.each( function(rec){
					switch( rec.get('class') ) {
						case 'ROLE' :
							slices.push({role_code:rec.get('code'), role_length:rec.get('length_hours')}) ;
							break ;
						case 'WHSE' :
							if( rec.get('readonly') ) {
								keepAltWhses = true ;
								break ;
							}
							slices.push({alt_whse_code:rec.get('code'), role_code:me.peopledayRecord.data.std_role_code, role_length:rec.get('length_hours')}) ;
							break ;
					}
				}) ;
				if( keepAltWhses ) {
					recordWorksStore.each( function(workRecord) {
						if( !Ext.isEmpty(workRecord.get('alt_whse_code')) ) {
							return ;
						}
						worksTodelete.push(workRecord) ;
					}) ;
					recordWorksStore.remove(worksTodelete) ;
				} else {
					recordWorksStore.removeAll() ;
				}
				recordWorksStore.add(slices) ;
			}
		}
		
		this.rhAbsSave() ;
	},
	rhAbsLoad: function() {
		
	},
	rhAbsSave: function() {
		var rhAbsValues = this.down('#absPanel').getValues() ;
		//console.dir(rhAbsValues) ;
	}
	
});