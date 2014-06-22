Ext.define('DbsPeopleRhRealAdvModel',{
	extend: 'Ext.data.Model',
	fields:[
		{name:'readonly', type:'boolean'},
		{name:'classe', type:'string'},
		{name:'code', type:'string'},
		{name:'length_hours', type:'number'}
	]
}) ;


Ext.define('Optima5.Modules.Spec.DbsPeople.RealAdvancedPanelRowEditor',{
	extend: 'Ext.grid.RowEditor',
	initKeyNav: function() {
		var me = this,
			plugin = me.editingPlugin;

		me.keyNav = new Ext.util.KeyNav(me.el, {
			enter: plugin.onEnterKey,
			esc: plugin.onEscKey,
			tab: plugin.onSpecialKey,
			left: plugin.onDirectionKey,
			right: plugin.onDirectionKey,
			scope: plugin
		});
	}
}) ;
Ext.define('Optima5.Modules.Spec.DbsPeople.RealAdvancedPanelRowEditing',{
	extend: 'Ext.grid.plugin.RowEditing',
	initEditor: function() {
		return editor = new Optima5.Modules.Spec.DbsPeople.RealAdvancedPanelRowEditor(this.initEditorConfig());
	},
	onSpecialKey: function(e) {
		e.stopEvent() ;
	},
	onDirectionKey: function(e) {
		e.stopEvent() ;
		var me = this,
			context = me.context,
			curColIdx, offsetCol,
			offsetCol,
			columnHeader ;
		if( !context ) {
			return ;
		}
		
		curColIdx = context.colIdx ;
		columnHeader = me.grid.getTopLevelVisibleColumnManager().getHeaderAtIndex(curColIdx);
		editorField = columnHeader.getEditor() ;
		if( editorField && editorField.listKeyNav && editorField.listKeyNav.map.isEnabled() ) {
			return ; // HACK : using BoundListKeyNav private property
		}
		
		offsetCol = 0 ;
		switch( e.getKey() ) {
			case e.LEFT :
				offsetCol-- ;
				break ;
			case e.RIGHT :
				offsetCol++ ;
				break ;
		}
		columnHeader = me.grid.getTopLevelVisibleColumnManager().getHeaderAtIndex(curColIdx+offsetCol);
		editorField = columnHeader.getEditor() ;
		if( !columnHeader || !editorField ) {
			return ;
		}
		context.column = columnHeader ;
		context.colIdx = curColIdx+offsetCol ;
		me.getEditor().focusContextCell() ;
	}
});

Ext.define('Optima5.Modules.Spec.DbsPeople.RealAdvancedPanel',{
	extend:'Ext.panel.Panel',
	requires:[
		'Ext.ux.dams.ColorCombo',
		'Ext.ux.dams.ComboBoxCached'
	],
	
	editDisabled: null,

	initComponent: function() {
		var me = this ;
		
		if( (me.parentRealPanel) instanceof Optima5.Modules.Spec.DbsPeople.RealPanel ) {} else {
			Optima5.Helper.logError('Spec:DbsPeople:RealAdvancedPanel','No parent reference ?') ;
		}
		if( (me.peopledayRecord) ) {} else {
			Optima5.Helper.logError('Spec:DbsPeople:RealAdvancedPanel','No peopledayRecord instance ?') ;
		}
		
		
		Ext.apply(me,{
			bodyCls: 'ux-noframe-bg',
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
						margin: 1
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
					margin: 5,
					layout: 'anchor',
					defaults: {
						labelAlign: 'left',
						labelWidth: 50,
						anchor: '100%',
						margin: 1
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
					},{
						xtype:'container',
						itemId: 'absForward',
						style:{textAlign:'center'},
						padding: "0 6px 6px 0",
						items:[{
							xtype: 'button',
							padding: '0 0px',
							text: 'Planning Abs',
							handler: function() {
								this.elXY = this.getEl().getXY() ;
								
								this.doSave() ;
								this.gridRecord.set( 'dummy', null );
								this.gridRecord.commit() ;
								this.parentRealPanel.openVirtualAfterPopup = true ;
								this.destroy() ;
							},
							scope: me
						}]
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
				title: 'Motif absence',
				items: [{
					xtype:'combobox',
					itemId: 'absCombobox',
					matchFieldWidth:false,
					listConfig:{width:250},
					forceSelection:true,
					allowBlank:false,
					editable:true,
					typeAhead:true,
					selectOnFocus: true,
					queryMode: 'local',
					displayField: 'text',
					valueField: 'id',
					fieldLabel: 'Motif',
					name: 'rh_abs_code' ,
					store: {
						fields:['id','text'],
						data: Optima5.Modules.Spec.DbsPeople.HelperCache.forTypeGetAll("ABS",true)
					}
				},{
					hidden: true, // TODO: tmp hide on-the-fly RH abs
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
						startDay: 1,
						fieldLabel: 'Début',
						name: 'rh_abs_date_start',
						anchor: '',
						width: 170
					},{
						xtype: 'datefield',
						allowBlank: false,
						format: 'd/m/Y',
						submitFormat: 'Y-m-d',
						startDay: 1,
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
				_totalLength: 0,
				columns:[{
					text:'Type',
					dataIndex: 'classe',
					width: 50,
					renderer: function( value, metaData, record ) {
						//return value ;
						switch( record.get('classe') ) {
							case 'ROLE' :
								metaData.tdCls = 'op5-spec-dbspeople-icon-role' ;
								break ;
							case 'ABS' :
								metaData.tdCls = 'op5-spec-dbspeople-icon-absence' ;
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
					text:'Role/Site/Abs',
					dataIndex: 'code',
					flex: 1,
					editor:{
						xtype:'combobox',
						matchFieldWidth:false,
						listConfig:{width:250},
						forceSelection:true,
						allowBlank:false,
						editable:true,
						typeAhead:true,
						selectOnFocus: true,
						queryMode: 'local',
						displayField: 'text',
						valueField: 'id',
						store: {
							fields:['id','text','auth_class'],
							data: []
						},
						listeners: {
							focus: {
								fn: function(cmb) {
									if(cmb.keyNav) {
										cmb.keyNav.disable() ;  //HACK : destroy combo.keyNav from being created
									}
								},
								single: true
							}
						}
					},
					renderer: function( value, metaData, record ) {
						//return value ;
						switch( record.get('classe') ) {
							case 'ROLE' :
								return me.parentRealPanel.helperGetRoleTxt( value ) ;
								break ;
							case 'ABS' :
								return me.parentRealPanel.helperGetAbsTxt( value ) ;
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
						minValue: 0,
						validator: function(v) {
							if( Ext.isEmpty(v) ) {
								return false ;
							}
							return ( v >= 0 ) ;
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
				plugins: [Ext.create('Optima5.Modules.Spec.DbsPeople.RealAdvancedPanelRowEditing',{
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
								
							columns[1].getEditor().setValue(null) ;  // HACK? Set value to null before switching stores
							switch( record.get('classe') ) {
								case 'ROLE' :
									columns[0].getEditor().update({iconCls:'op5-spec-dbspeople-icon-role'}) ;
									columns[1].getEditor().getStore().loadData( Optima5.Modules.Spec.DbsPeople.HelperCache.forTypeGetAll("ROLE") ) ;
									break ;
								case 'ABS' :
									columns[0].getEditor().update({iconCls:'op5-spec-dbspeople-icon-absence'}) ;
									columns[1].getEditor().getStore().loadData( Optima5.Modules.Spec.DbsPeople.HelperCache.forTypeGetAll("ABS",true) ) ;
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
				})],
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
							itemId: 'btnItemAbs',
							iconCls: 'op5-spec-dbspeople-icon-absence',
							text: 'Absence',
							handler: function(btn) {
								this.onBtnAdd('ABS') ;
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
			absForward = this.down('#absForward'),
			absPanel = this.down('#absPanel'),
			slicesPanel = this.down('#slicesPanel') ;
			
		if( me.editDisabled ) {
			absPanel.setVisible(false) ;
			slicesPanel.setVisible(false) ;
			return ;
		}
		
		absForward.setVisible(absCheckbox.getValue()) ;
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
			
		// done 14-05-07 : durée restante standard
		var newRecordData = {
			classe:tClass
		};
		var remainLength = grid._totalLength - store.sum('length_hours') ;
		if( remainLength > 0 ) {
			newRecordData['length_hours'] = remainLength ;
		}
		
		var newRecordIndex = 0 ;
		
		store.insert(newRecordIndex, Ext.create('DbsPeopleRhRealAdvModel',newRecordData) );
		store.sync() ;
		
		grid.getPlugin('rowediting').startEdit(newRecordIndex, 1);
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
			btnItemRole = toolbar.down('#btnItemRole'),
			btnItemAbs  = toolbar.down('#btnItemAbs') ;
		
		var storeData = [],
			gridWhse = me.gridRecord.get('whse_code'),
			stdWhse = me.peopledayRecord.get('std_whse_code'),
			altWhse = ( stdWhse != gridWhse ? gridWhse : null ),
			absMode, absCode,
			worksSlices = Ext.pluck( me.peopledayRecord.works().getRange(), 'data' ),
			absSlices = Ext.pluck( me.peopledayRecord.abs().getRange(), 'data' ),
			slice ;
			
		
		if( me.peopledayRecord.get('real_is_abs') ) {
			absMode = true ;
			if( me.peopledayRecord.abs().getCount() > 0 ) {
				absCode = me.peopledayRecord.abs().getAt(0).data.abs_code ;
			}
		}
		
		
		var altWhsesObj = {} , altDuration = 0 ;
		for( var idx=0 ; idx<worksSlices.length ; idx++ ) {
			slice = worksSlices[idx] ;
			
			if( altWhse != null ) {
				if( slice.alt_whse_code==altWhse ) {
					storeData.push({
						classe:'ROLE',
						code:slice.role_code,
						length_hours: slice.role_length
					});
					altDuration += slice.role_length ;
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
				classe:'ROLE',
				code:slice.role_code,
				length_hours: slice.role_length
			});
		}
		Ext.Object.each( altWhsesObj, function( altWhseCode, length ) {
			storeData.push({
				readonly: true,
				classe:'WHSE',
				code:altWhseCode,
				length_hours: length
			});
		}) ;
		
		for( var idx=0 ; idx<absSlices.length ; idx++ ) {
			slice = absSlices[idx] ;
			
			if( altWhse != null ) {
				continue ;
			}
			
			storeData.push({
				classe:'ABS',
				code:slice.abs_code,
				length_hours: slice.abs_length
			});
		}
		
		// done 14-05-07 : altWhse + vide => mode désactivé, aucun changement
		if( altWhse != null && storeData.length == 0 ) {
			me.editDisabled = true ;
		} else {
			me.editDisabled = false ;
		}
		
		// done 14-05-12 : total std duration
		if( altWhse == null ) {
			slicesPanel._totalLength = me.peopledayRecord.data.std_daylength ;
		} else {
			slicesPanel._totalLength = altDuration ;
		}
		
		// Set UI
		absCheckbox.setVisible( altWhse==null && me.peopledayRecord.data.std_daylength > 0 ) ;
		absCheckbox.setValue( absMode ) ;
		absCombobox.setValue( absCode ) ;
		slicesPanel.getStore().loadRawData( storeData ) ;
		btnItemRole.setVisible(true);
		btnItemAbs.setVisible( altWhse==null );
		btnItemMove.setVisible( altWhse==null );
		me.calcLayout() ;
	},
	doCheckBeforeSave: function() {
		var me = this ;
		
		var peopledayRecord = me.peopledayRecord ;
		
		var localGrid = this.child('grid'),
			localStore = localGrid.getStore() ;
			
		if( localStore.getCount() == 0 ) {
			// tjr OK
			return ;
		}
			
		var isInvalid = false ;
		localStore.each( function(rec){
			if( Ext.isEmpty(rec.get('code')) || rec.get('length_hours') == 0 ) {
				isInvalid = true ;
			}
		}) ;
		if( isInvalid ) {
			return 'Saisie rôles/heures incomplète' ;
		}
		
		var totalLength = false ;
		localStore.each( function(rec){
			totalLength += rec.get('length_hours') ;
		}) ;
		if( totalLength > peopledayRecord.data.std_daylength_max ) {
			return 'Nb heures dépassé ('+peopledayRecord.data.std_daylength_max+'h max.)' ;
		}
		
		return null ;
	},
	doSave: function() {
		var me = this ;
			
		var gridWhse = me.gridRecord.get('whse_code'),
			stdWhse = me.peopledayRecord.get('std_whse_code'),
			altWhse = ( stdWhse != gridWhse ? gridWhse : null );
			
		var recordWorksStore = me.peopledayRecord.works(),
			recordAbsStore = me.peopledayRecord.abs() ;
			
		var localGrid = this.child('grid'),
			localStore = localGrid.getStore() ;
		
		
		if( altWhse != null ) { // ****** Mode autre warehouse *********
			if( me.editDisabled ) {
				// done 14-05-07 : mode désactivé, aucun changement
				return ;
			}
			
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
					if( rec.get('classe') != 'ROLE' ) {
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
			me.peopledayRecord.set('real_is_abs',true) ;
			
			var absCode = this.down('#absPanel').down('combobox').getValue() ;
			recordWorksStore.removeAll() ;
			recordAbsStore.removeAll() ;
			if( !Ext.isEmpty(absCode) ) {
				recordAbsStore.add({abs_code:absCode, abs_length:me.peopledayRecord.data.std_daylength}) ;
			}
			
		} else { // ********* Mode standard (master) *********
			me.peopledayRecord.set('real_is_abs',false) ;
			
			recordAbsStore.removeAll() ;
			if( localStore.getCount() == 0 ) {
				recordWorksStore.removeAll() ;
				if( me.peopledayRecord.data.std_abs_code.charAt(0) != '_' ) {
					recordAbsStore.add({
						abs_code:me.peopledayRecord.data.std_abs_code,
						abs_length:me.peopledayRecord.data.std_daylength
					}) ;
				} else if( me.peopledayRecord.data.std_daylength > 0 ) {
					recordWorksStore.add({
						role_code:me.peopledayRecord.data.std_role_code,
						role_length:me.peopledayRecord.data.std_daylength
					}) ;
				}
			} else {
				var worksTodelete = [] ;
				var worksSlices = [], keepAltWhses = false ;
				var absSlices = [] ;
				localStore.each( function(rec){
					switch( rec.get('classe') ) {
						case 'ROLE' :
							worksSlices.push({role_code:rec.get('code'), role_length:rec.get('length_hours')}) ;
							break ;
						case 'ABS' :
							absSlices.push({abs_code:rec.get('code'), abs_length:rec.get('length_hours')}) ;
							break ;
						case 'WHSE' :
							if( rec.get('readonly') ) {
								keepAltWhses = true ;
								break ;
							}
							worksSlices.push({alt_whse_code:rec.get('code'), role_code:me.peopledayRecord.data.std_role_code, role_length:rec.get('length_hours')}) ;
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
				recordWorksStore.add(worksSlices) ;
				recordAbsStore.add(absSlices) ;
			}
		}
	}	
});