Ext.define('Optima5.Modules.Spec.RsiRecouveo.BankPanel',{
	extend:'Ext.panel.Panel',
	
	requires: [
		'Optima5.Modules.Spec.RsiRecouveo.RecordGroupInputPanel',
		'Optima5.Modules.Spec.RsiRecouveo.RecordGroupAssocPanel'
	],
	
	initComponent: function() {
		Ext.apply(this,{
			layout: 'fit',
			items: [],
			tbar:[{
				hidden: this._readonlyMode,
				icon: 'images/op5img/ico_back_16.gif',
				text: '<u>Back</u>',
				handler: function(){
					this.doQuit() ;
				},
				scope: this
			},'-',{
				text: '<b>Remise de chèque</b>',
				iconCls: 'op5-crmbase-datatoolbar-file-importdata',
				handler: function() {
					this.openRecordGroupInputPanel() ;
				},
				scope: this
			},{
				text: '<b>Groupage VPC</b>',
				iconCls: 'op5-crmbase-datatoolbar-file-importdata',
				handler: function() {
					this.openRecordGroupAssocPanel() ;
				},
				scope: this
			}]
		}) ;
		this.callParent() ;
		this.resetPanel() ;
	},
	resetPanel: function() {
		this.removeAll() ;
		this.add({
			xtype: 'component',
			cls:'op5-waiting'
		});
		Ext.defer(function() {
			this.configureViews() ;
		},500,this);
	},
	configureViews: function() {
		var atrRenderer = function(value, metaData, record, rowIndex, colIndex, store, view) {
			var column = view.ownerCt.columns[colIndex],
				value = record.get(column.rendererDataindex) ;
			return value ;
		}
		var atrColumns = [] ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAllAtrIds(), function(atrId) {
			var atrRecord = Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAtrHeader(atrId) ;
			//console.dir(atrRecord) ;
			atrColumns.push({
				text: atrRecord.atr_txt,
				dataIndex: atrRecord.bible_code,
				rendererDataindex: atrRecord.bible_code + '_text',
				width:125,
				align: 'center',
				renderer: atrRenderer
			}) ;
		}) ;
		
		var pCenter = this.down('#pCenter') ;
		var columns = [{
			text: 'New?',
			dataIndex: 'alloc_is_ok',
			width:48,
			renderer: function(value,metaData,record) {
				if( !value ) {
					metaData.tdCls += ' op5-spec-rsiveo-icon-priority' ;
				}
				return '' ;
			}
		},{
			text: 'Date valeur',
			dataIndex: 'bank_date',
			width:100,
			renderer: Ext.util.Format.dateRenderer('d/m/Y')
		},{
			text: 'Libelle',
			dataIndex: 'bank_ref',
			width:275
		},{
			text: 'Montant',
			dataIndex: 'bank_amount',
			align: 'right',
			width: 90,
			tdCls: 'op5-spec-dbstracy-boldcolumn',
			renderer: function(v) {
				return Ext.util.Format.number(v, '0,000.00') ;
			}
		},{
			text: 'Solde',
			dataIndex: 'calc_balance',
			align: 'right',
			width: 90,
			renderer: function(v) {
				return Ext.util.Format.number(v, '0,000.00') ;
			}
		},{
			itemId: 'colAllocation',
			text: 'Allocation',
			columns: [{
				text: 'Opération/MdP',
				dataIndex: 'alloc_type',
				width:150,
				editor: Ext.create('Optima5.Modules.Spec.RsiRecouveo.CfgParamField',{
					cfgParam_id: 'OPT_RECLOCAL',
					cfgParam_emptyDisplayText: 'Type paiement',
					optimaModule: this.optimaModule,
					accountRecord: this._accountRecord,
					//allowBlank: false
					listeners: {
						change: function(cmb) {
							var optReclocalValue = cmb.getValue(),
								nextValue = null ;
							Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getOptData('OPT_RECLOCAL'), function(row) {
								if( row.id==optReclocalValue ) {
									nextValue = row.next ;
								}
							}) ;
							if( !nextValue ) {
								return ;
							}
							
							var fieldTypeAllocation = this.down('grid').headerCt.down('[dataIndex="_type_allocation"]').getEditor() ;
							if( fieldTypeAllocation.getValue() != nextValue ) {
								this.down('grid').headerCt.down('[dataIndex="_type_allocation"]').getEditor().setValue(nextValue) ;
								this.onEditorTypeAllocationChange(nextValue) ;
							}
						},
						scope: this
					}
				}),
				filter: {
					type: 'op5crmbasebibletree',
					optimaModule: this.optimaModule,
					bibleId: 'OPT_RECLOCAL'
				}
			},{
				text: 'Type allocation',
				dataIndex: '_type_allocation',
				width:125,
				editor: {
					xtype: 'combobox',
					readOnly: true,
					forceSelection: true,
					editable: false,
					store: {
						fields: ['code','lib'],
						data : [
							{code:'account', lib:'Compte acheteur'},
							{code:'recordgroup_input', lib:'Remise chèque(s)'},
							{code:'recordgroup_assoc', lib:'Groupage / VPC'}
						]
					},
					queryMode: 'local',
					displayField: 'lib',
					valueField: 'code',
					listeners: {
						select: function(cmb) {
							this.onEditorTypeAllocationChange(cmb.getValue()) ;
						},
						scope: this
					}
				},
				renderer: function(v) {
					switch(v) {
						case 'account' :
							return 'Compte acheteur' ;
						case 'recordgroup_input' :
							return 'Remise chèque(s)' ;
						case 'recordgroup_assoc' :
							return 'Groupage / VPC' ;
						default : break ;
					}
				}
			},{
				text: 'Compte / Remise',
				dataIndex: '_editor_allocation',
				width:300,
				editorAccount: {
					xtype: 'op5crmbasebiblepicker',
					optimaModule: this.optimaModule,
					bibleId: 'LIB_ACCOUNT'
				},
				editorRecordgroupInput: {
					xtype: 'combobox',
					forceSelection: true,
					editable: false,
					store: {
						fields: ['recordgroup_code'],
						data : [],
						sorters: [{
							property: 'recordgroup_code',
							direction: 'DESC'
						}]
					},
					queryMode: 'local',
					displayField: 'recordgroup_code',
					valueField: 'recordgroup_code'
				},
				editorRecordgroupAssoc: {
					xtype: 'combobox',
					forceSelection: true,
					editable: false,
					store: {
						fields: ['recordgroup_code'],
						data : [],
						sorters: [{
							property: 'recordgroup_code',
							direction: 'DESC'
						}]
					},
					queryMode: 'local',
					displayField: 'recordgroup_code',
					valueField: 'recordgroup_code'
				},
				renderer: function(v,m,r) {
					switch( r.get('_type_allocation') ) {
						case 'account' :
							return '<b>'+r.get('alloc_link_account')+'</b>'+'&#160;&#160;&#160;&#160;'+r.get('alloc_link_account_txt') ;
							break ;
						case 'recordgroup' :
						case 'recordgroup_input' :
						case 'recordgroup_assoc' :
							return r.get('alloc_link_recordgroup') ;
							break ;
					}
				}
			}]
		}] ;
		
		columns = {
			defaults: {
				menuDisabled: false,
				draggable: false,
				sortable: true,
				hideable: true,
				resizable: true,
				groupable: false,
				lockable: false
			},
			items: columns
		}
		
		this.tmpModelName = Optima5.Modules.Spec.RsiRecouveo.HelperCache.getBankModel()+'-' + this.getId() + (++this.tmpModelCnt) ;
		Ext.ux.dams.ModelManager.unregister( this.tmpModelName ) ;
		Ext.define(this.tmpModelName, {
			extend: Optima5.Modules.Spec.RsiRecouveo.HelperCache.getBankModel(),
			idProperty: 'bank_filerecord_id',
			fields: [
				{name:'_type_allocation', type:'string'},
				{name:'_phantom', type:'boolean'}
			]
		});
		
		this.removeAll() ;
		this.add({
			xtype: 'grid',
			itemId: 'pGrid',
			columns: columns,
			store: {
				model: this.tmpModelName,
				data: [],
				proxy: {
					type: 'memory'
				}
			},
			plugins: [{
				ptype: 'uxgridfilters'
			},{
				ptype: 'rowediting',
				pluginId: 'rowediting',
				listeners: {
					edit: this.onEditRecord,
					canceledit: this.onCancelEditRecord,
					beforeedit: this.onBeforeEditRecord,
					scope: this
				}
			}]
		});
		
		this.doLoad() ;
	},
	doLoad: function() {
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'bank_getRecords'
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					Ext.MessageBox.alert('Error','Error') ;
					return ;
				}
				Ext.Array.each( ajaxResponse.data, function(row) {
					if( !Ext.isEmpty(row.alloc_link_account) ) {
						row['_type_allocation'] = 'account';
					} else if( !Ext.isEmpty(row.alloc_link_recordgroup) ) {
						row['_type_allocation'] = 'recordgroup';
						if( !Ext.isEmpty(row.alloc_link_recordgroup_type) ) {
							row['_type_allocation'] = 'recordgroup_'+row.alloc_link_recordgroup_type;
						}
					}
				},this) ;
				
				this.down('grid').getStore().loadData(ajaxResponse.data) ;
			},
			scope: this
		}) ;
		
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'recordgroup_input_list'
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					Ext.MessageBox.alert('Error','Error') ;
					return ;
				}
				
				var records = [] ;
				Ext.Array.each(ajaxResponse.data, function(group) {
					records.push({recordgroup_code: group}) ;
				}) ;
				
				var allocationColumn = this.down('grid').headerCt.down('[dataIndex="_editor_allocation"]') ;
				allocationColumn.editorRecordgroupInput.store.data = records ; //HACK
			},
			scope: this
		}) ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'recordgroup_assoc_list'
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					Ext.MessageBox.alert('Error','Error') ;
					return ;
				}
				
				var records = [] ;
				Ext.Array.each(ajaxResponse.data, function(group) {
					records.push({recordgroup_code: group}) ;
				}) ;
				
				var allocationColumn = this.down('grid').headerCt.down('[dataIndex="_editor_allocation"]') ;
				allocationColumn.editorRecordgroupAssoc.store.data = records ; //HACK
			},
			scope: this
		}) ;
	},
	
	
	onEditRecord: function(editor,context) {
		switch( context.newValues['_type_allocation'] ) {
			case 'account' :
				context.record.set('_type_allocation',context.newValues['_type_allocation']) ;
				context.record.set('alloc_link_account',context.newValues['_editor_allocation']) ;
				break ;
			case 'recordgroup_input' :
				context.record.set('_type_allocation',context.newValues['_type_allocation']) ;
				context.record.set('alloc_link_recordgroup',context.newValues['_editor_allocation']) ;
				context.record.set('alloc_link_recordgroup_type','input') ;
				break ;
			case 'recordgroup_assoc' :
				context.record.set('_type_allocation',context.newValues['_type_allocation']) ;
				context.record.set('alloc_link_recordgroup',context.newValues['_editor_allocation']) ;
				context.record.set('alloc_link_recordgroup_type','assoc') ;
				break ;
		}
		
		
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'bank_setAlloc',
				bank_filerecord_id: context.record.getId(),
				data: Ext.JSON.encode(context.record.getData())
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					return ;
				}
				context.record.commit() ;
			},
			callback: function() {
			},
			scope: this
		}) ;
		
		
		var recAccount = context.record.get('alloc_link_account') ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_action: 'data_getBibleGrid',
				bible_code: 'LIB_ACCOUNT',
				filter: Ext.JSON.encode([{property: 'str_search',value:recAccount}])
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false || ajaxResponse.data.length != 1 ) {
					return ;
				}
				context.record.set('alloc_link_account_txt',ajaxResponse.data[0]['field_ACC_NAME']) ;
				context.record.set('_phantom',false) ;
			},
			callback: function() {
			},
			scope: this
		}) ;
	},
	onCancelEditRecord: function(editor,context) {
		if( context.record.get('_phantom') ) {
			context.grid.getStore().remove(context.record) ;
		}
	},
	onBeforeEditRecord: function(editor,context) {
		var optReclocalValue = context.record.get('_type_allocation'),
			nextValue = null ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getOptData('OPT_RECLOCAL'), function(row) {
			if( row.id==optReclocalValue ) {
				nextValue = row.next ;
			}
		}) ;
		if( nextValue ) {
			context.record.set('_type_allocation',nextValue) ;
		}
		
		
		switch( context.record.get('_type_allocation') ) {
			case 'account' :
				context.record.set('_editor_allocation',context.record.get('alloc_link_account')) ;
				break ;
			case 'recordgroup' :
			case 'recordgroup_assoc' :
			case 'recordgroup_input' :
				context.record.set('_editor_allocation',context.record.get('alloc_link_recordgroup')) ;
				break ;
		}
		this.onEditorTypeAllocationChange(context.record.get('_type_allocation')) ;
		
	},
	onEditorTypeAllocationChange: function(selectedAllocation) {
		// Load appropriate templates
		var templatesData = [],
			allocationColumn = this.down('grid').headerCt.down('[dataIndex="_editor_allocation"]'),
			allocationEditor ;
		
		switch( selectedAllocation ) {
			case 'account' :
				allocationEditor = Ext.clone( allocationColumn.editorAccount ) ;
				//allocationEditor.value = editingRecord.get('acc_id') ;
				break ;
			case 'recordgroup_input' :
				allocationEditor = Ext.clone( allocationColumn.editorRecordgroupInput ) ;
				//allocationEditor.value = editingRecord.get('recordgroup_id') ;
				break ;
			case 'recordgroup_assoc' :
				allocationEditor = Ext.clone( allocationColumn.editorRecordgroupAssoc ) ;
				//allocationEditor.value = editingRecord.get('recordgroup_id') ;
				break ;
		}
		if( !allocationEditor ) {
			allocationColumn.setEditor(null);
		} else {
			allocationColumn.setEditor(allocationEditor) ;
		}
		if( allocationColumn.getEditor().el ) {
			this.down('grid').getPlugin('rowediting').getEditor().syncFieldWidth(allocationColumn) ; // HACK
		}
	},
	
	
	
	doQuit: function() {
		this.destroy() ;
	},
	
	openRecordGroupInputPanel: function() {
		this.openRecordGroupPanel('Optima5.Modules.Spec.RsiRecouveo.RecordGroupInputPanel',600) ;
	},
	openRecordGroupAssocPanel: function() {
		this.openRecordGroupPanel('Optima5.Modules.Spec.RsiRecouveo.RecordGroupAssocPanel',800) ;
	},
	openRecordGroupPanel: function(className,width) {
		var me = this ;
		
		var setSizeFromParent = function( parentPanel, targetPanel ) {
			targetPanel.setSize({
				width: width,
				height: parentPanel.getSize().height - 60
			}) ;
		};
		
		var dataImportPanel = Ext.create(className,{
			optimaModule: this.optimaModule,
			width:800, // dummy initial size, for border layout to work
			height:600, // ...
			floating: true,
			renderTo: me.getEl(),
			tools: [{
				type: 'close',
				handler: function(e, t, p) {
					p.ownerCt.destroy();
				}
			}]
		});
		
		dataImportPanel.mon(me,'resize', function() {
			setSizeFromParent( me, dataImportPanel ) ;
		},me) ;
		
		// Size + position
		setSizeFromParent(me,dataImportPanel) ;
		dataImportPanel.on('destroy',function() {
			me.getEl().unmask() ;
			// me.fireEvent('qbookztemplatechange') ;
		},me,{single:true}) ;
		me.getEl().mask() ;
		
		dataImportPanel.show();
		dataImportPanel.getEl().alignTo(me.getEl(), 't-t?',[0,50]);
	}
}) ;
