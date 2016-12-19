Ext.define('RsiRecouveoFileDetailActionsTreeModel', {
    extend: 'Ext.data.Model',
    fields: [
        {name: 'action_txt',  type: 'string'},
		  {name: 'action_date', type: 'string'},
		  {name: 'action_result',  type: 'string'},
		  {name: 'action_result_pending', type:'boolean'},
		  {name: 'action_result_ok', type:'boolean'}
     ]
});

Ext.define('Optima5.Modules.Spec.RsiRecouveo.FileDetailPanel',{
	extend:'Ext.window.Window',
	
	requires: [
		'Optima5.Modules.Spec.RsiRecouveo.CfgParamField',
		'Optima5.Modules.Spec.RsiRecouveo.ActionAgreeStartForm',
		'Optima5.Modules.Spec.RsiRecouveo.ActionCallInForm',
		'Optima5.Modules.Spec.RsiRecouveo.ActionMailOutForm'
	],
	
	_readonlyMode: false,
	
	initComponent: function() {
		
		
		var statusMap = {} ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getStatusAll(), function(status) {
			statusMap[status.status_id] = status ;
		}) ;
		
		var actionMap = {} ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getActionAll(), function(action) {
			actionMap[action.action_id] = action ;
		}) ;
		
		
		
		
		var formItems = []
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAllAtrIds(), function(atrId) {
			var atrRecord = Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAtrHeader(atrId) ;
			//console.dir(atrRecord) ;
			formItems.push(Ext.create('Optima5.Modules.Spec.RsiRecouveo.CfgParamField',{
				cfgParam_id: atrId,
				cfgParam_emptyDisplayText: 'Select...',
				optimaModule: this.optimaModule,
				name: atrId,
				allowBlank: false,
				fieldLabel: atrRecord.atr_txt
			})) ;
		},this) ;
		formItems.push({
			xtype: 'textfield',
			fieldLabel: '<b># Acheteur</b>',
			name: 'acc_id',
			allowBlank: false,
			anchor: '',
			width: 260
		},{
			xtype: 'textfield',
			fieldLabel: 'Nom / Société',
			name: 'acc_txt'
		},{
			xtype: 'textfield',
			fieldLabel: 'SIREN/SIRET',
			name: 'acc_siret',
			anchor: '',
			width: 300
		}) ;
		
		Ext.apply(this,{
			layout: {
				type: 'hbox',
				align: 'stretch'
			},
			tbar:[{
				itemId: 'tbSave',
				iconCls:'op5-sdomains-menu-submit',
				text:'Save',
				handler: function() {
					this.handleSaveHeader() ;
				},
				scope:this
			},'->',{
				itemId: 'tbNew',
				icon: 'images/op5img/ico_blocs_small.gif',
				text: '<b>Nouvelle action</b>',
				menu:[{
					icon: 'images/modules/tmp/rsiveo-call-in-16.png',
					text: 'Appel entrant',
					handler: function() {
						this.openActionPanel('Optima5.Modules.Spec.RsiRecouveo.ActionCallInForm',400,500) ;
					},
					scope: this
				},{
					icon: 'images/modules/tmp/rsiveo-mail-out-16.png',
					text: 'Envoi courrier',
					handler: function() {
						this.openActionPanel('Optima5.Modules.Spec.RsiRecouveo.ActionMailOutForm',800,600) ;
					},
					scope: this
				},{
					icon: 'images/modules/tmp/rsiveo-agree-start-16.png',
					text: 'Promesse réglement',
					handler: function() {
						this.openActionPanel('Optima5.Modules.Spec.RsiRecouveo.ActionAgreeStartForm',400,400) ;
					},
					scope: this
				}]
			}],
			items:[{
				flex: 1,
				xtype: 'panel',
				layout: {
					type: 'vbox',
					align: 'stretch'
				},
				border: false,
				items: [{
					flex:1,
					xtype: 'form',
					itemId: 'pHeaderForm',
					bodyCls: 'ux-noframe-bg',
					bodyPadding: 15,
					layout:'anchor',
					fieldDefaults: {
						labelWidth: 125,
						anchor: '100%'
					},
					items: formItems
				},{
					flex: 1,
					title: 'Adresses',
					itemId: 'gridAdrPostal',
					xtype: 'damsembeddedgrid',
					columns: [{
						hidden: true,
						text: 'adrpostal_filerecord_id',
						dataIndex: 'adrpostal_filerecord_id'
					},{
						text: 'Description',
						width: 100,
						dataIndex: 'adr_name',
						editor: {xtype:'textfield'}
					},{
						text: 'Telephone',
						width: 250,
						dataIndex: 'adr_postal_txt',
						renderer: function(v) {
							return Ext.util.Format.nl2br( Ext.String.htmlEncode( v ) ) ;
						},
						editor: {xtype:'textarea'}
					},{
						text: 'Status',
						width: 60,
						dataIndex: 'status',
						renderer: function(v,metaData) {
							if( v ) {
								metaData.tdCls += ' op5-spec-dbstracy-kpi-ok' ;
							} else {
								metaData.tdCls += ' op5-spec-dbstracy-kpi-nok' ;
							}
						},
						editor: {xtype: 'checkboxfield'}
					}],
					listeners: {
						edited: function() {
							this.handleSaveHeader();
						},
						scope: this
					}
				},{
					flex: 1,
					title: 'Contacts Téléphone',
					itemId: 'gridAdrTel',
					xtype: 'damsembeddedgrid',
					columns: [{
						hidden: true,
						text: 'adrtel_filerecord_id',
						dataIndex: 'adrtel_filerecord_id'
					},{
						text: 'Description',
						width: 100,
						dataIndex: 'adr_name',
						editor: {xtype:'textfield'}
					},{
						text: 'Telephone',
						width: 180,
						dataIndex: 'adr_tel_txt',
						editor: {xtype:'textfield'}
					},{
						text: 'Status',
						width: 60,
						dataIndex: 'status',
						type: 'boolean',
						renderer: function(v,metaData) {
							if( v ) {
								metaData.tdCls += ' op5-spec-dbstracy-kpi-ok' ;
							} else {
								metaData.tdCls += ' op5-spec-dbstracy-kpi-nok' ;
							}
						},
						editor: {xtype: 'checkboxfield'}
					}],
					listeners: {
						edited: function() {
							this.handleSaveHeader();
						},
						scope: this
					}
				}]
			},{
				flex: 1,
				bodyCls: 'ux-noframe-bg',
				title: 'Factures',
				layout: {
					type: 'vbox',
					align: 'stretch'
				},
				items: [{
					height: 65,
					itemId: 'pRecordsHeader',
					xtype:'component',
					hidden: true,
					tpl: [
						'<div class="op5-spec-dbspeople-realvalidhdr">',
							'<div class="op5-spec-dbspeople-realvalidhdr-inline-tbl">',
								'<div class="op5-spec-dbspeople-realvalidhdr-inline-elem op5-spec-rsiveo-factureheader-icon">',
								'</div>',
								'<div class="op5-spec-dbspeople-realvalidhdr-inline-elem">',
									'<table class="op5-spec-dbspeople-realvalidhdr-tbl">',
									'<tr>',
										'<td class="op5-spec-dbspeople-realvalidhdr-tdlabel">Nb Factures :</td>',
										'<td class="op5-spec-dbspeople-realvalidhdr-tdvalue">{inv_nb}</td>',
									'</tr>',
									'<tr>',
										'<td class="op5-spec-dbspeople-realvalidhdr-tdlabel">Total encours :</td>',
										'<td class="op5-spec-dbspeople-realvalidhdr-tdvalue">{inv_amount_total}&#160;€</td>',
									'</tr>',
									'<tr>',
										'<td class="op5-spec-dbspeople-realvalidhdr-tdlabel">Reste dû :</td>',
										'<td class="op5-spec-dbspeople-realvalidhdr-tdvalue">{inv_amount_due}&#160;€</td>',
									'</tr>',
									'</table>',
								'</div>',
							'</div>',
						'</div>',
						{
							disableFormats: true
						}
					]
				},{
					flex: 1,
					itemId: 'pRecordsGrid',
					xtype: 'grid',
					columns: [{
						text: 'Libellé',
						dataIndex: 'record_id',
						width: 170
					},{
						text: 'Lettrage',
						dataIndex: 'clear_assign',
						width: 80
					},{
						text: 'Date',
						dataIndex: 'date_value',
						align: 'center',
						width: 80,
						renderer: Ext.util.Format.dateRenderer('d/m/Y')
					},{
						text: 'Montant',
						dataIndex: 'amount',
						align: 'right',
						width: 80
					}],
					store: {
						model: 'RsiRecouveoRecordModel',
						data: [],
						sorters:[{
							property: 'date_value',
							direction: 'DESC'
						}]
					}
				}]
			},{
				flex: 1,
				xtype: 'panel',
				layout: {
					type: 'border',
					align: 'stretch'
				},
				border: false,
				items:[{
					region: 'center',
					flex: 3,
					xtype: 'grid',
					_statusMap: statusMap,
					_actionMap: actionMap,
					itemId: 'pActionsGrid',
					viewConfig: {
						itemId: 'view',
						plugins: [{
							pluginId: 'preview',
							ptype: 'preview',
							bodyField: 'txt',
							expanded: true
						}],
						listeners: {
							scope: this
						}
					},
					columns: [{
						dataIndex: 'link_status',
						width: 40,
						renderer: function(v,metaData,r) {
							var statusMap = this._statusMap ;
							if( statusMap.hasOwnProperty(v) ) {
								var statusData = statusMap[v] ;
								metaData.style += 'color: white ; background: '+statusData.status_color ;
								return '' ;
							}
							return '' ;
						}
					},{
						dataIndex: 'link_action',
						width: 100,
						renderer: function(v,metaData,r) {
							var actionMap = this._actionMap ;
							if( actionMap.hasOwnProperty(v) ) {
								var actionData = actionMap[v] ;
								return '<b>'+actionData.action_txt+'</b>' ;
							}
							return '?' ;
						}
					},{
						text: 'Planning',
						width: 100,
						dataIndex: 'date_sched',
						renderer: Ext.util.Format.dateRenderer('d/m/Y')
					},{
						text: 'Status',
						width: 48,
						dataIndex: 'status_is_ok',
						renderer: function(v,metaData,r) {
							if( !v ) {
								metaData.tdCls += ' op5-spec-dbstracy-files-nowarning' ;
							} else {
								metaData.tdCls += ' op5-spec-dbstracy-kpi-ok' ;
							}
							return '' ;
						}
					},{
						text: 'Réalisé',
						width: 100,
						dataIndex: 'date_actual',
						renderer: Ext.util.Format.dateRenderer('d/m/Y')
					}],
					store: {
						model: 'RsiRecouveoFileActionModel',
						data: [],
						sorters: [{
							property: 'calc_date',
							direction: 'DESC'
						}],
						proxy: {
							type: 'memory',
							reader: {
								type: 'json'
							}
						}
					}
				}]
			}]
		}) ;
		
		this.callParent() ;
		
		if( this._readonlyMode ) {
			this.down('toolbar').setVisible(false) ;
		}
		
		this.on('afterrender', function() {
			this.loadFile( this._fileFilerecordId ) ;
		},this) ;
		this.on('beforedestroy',this.onBeforeDestroy,this) ;
		
		this.mon(this.optimaModule,'op5broadcast',this.onCrmeventBroadcast,this) ;
	},
	onCrmeventBroadcast: function(crmEvent, eventParams) {
		switch( crmEvent ) {
			case 'attachmentschange' :
				if( this._orderFilerecordId && this._orderFilerecordId == eventParams.orderFilerecordId ) {
					this.loadOrder( this._orderFilerecordId ) ;
				}
				break ;
			default: break ;
		}
	},
	
	showLoadmask: function() {
		if( this.rendered ) {
			this.doShowLoadmask() ;
		} else {
			this.on('afterrender',this.doShowLoadmask,this,{single:true}) ;
		}
	},
	doShowLoadmask: function() {
		if( this.loadMask ) {
			return ;
		}
		this.loadMask = Ext.create('Ext.LoadMask',{
			target: this,
			msg:"Please wait..."
		}).show();
	},
	hideLoadmask: function() {
		this.un('afterrender',this.doShowLoadmask,this) ;
		if( this.loadMask ) {
			this.loadMask.destroy() ;
			this.loadMask = null ;
		}
	},
	
	
	
	loadFile: function( filerecordId ) {
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'file_getRecords',
				filter_fileFilerecordId_arr: Ext.JSON.encode([filerecordId])
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false || ajaxResponse.data.length != 1 ) {
					Ext.MessageBox.alert('Error','Error') ;
					return ;
				}
				this.onLoadFile(Ext.ux.dams.ModelManager.create('RsiRecouveoFileModel',ajaxResponse.data[0])) ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	onLoadFile: function( fileRecord ) {
		this._fileNew = false ;
		this._fileFilerecordId = fileRecord.getId() ;
		this._fileRecord = fileRecord ;
		
		//fHeader
		this.down('#pHeaderForm').getForm().reset() ;
		this.down('#pHeaderForm').getForm().loadRecord(fileRecord) ;
		if( this._readonlyMode ) {
			this.down('#pHeaderForm').getForm().getFields().each( function(field) {
				field.setReadOnly(true) ;
			});
		}
		
		var adrPostalData = [] ;
		fileRecord.adr_postal().each( function(rec) {
			adrPostalData.push(rec.getData()) ;
		}) ;
		this.down('#gridAdrPostal').setTabData(adrPostalData) ;
		
		var adrTelData = [] ;
		fileRecord.adr_tel().each( function(rec) {
			adrTelData.push(rec.getData()) ;
		}) ;
		this.down('#gridAdrTel').setTabData(adrTelData) ;
		
		
		this.down('#pRecordsHeader').setData({
			inv_nb: fileRecord.get('inv_nb'),
			inv_amount_total: fileRecord.get('inv_amount_total'),
			inv_amount_due: fileRecord.get('inv_amount_due')
		});
		this.down('#pRecordsHeader').setVisible(true) ;
		
		var pRecordsGridData = [] ;
		fileRecord.records().each(function(rec) {
			pRecordsGridData.push(rec.getData()) ;
		}) ;
		this.down('#pRecordsGrid').getStore().loadRawData(pRecordsGridData) ;
		
		var pActionsGridData = [] ;
		fileRecord.actions().each(function(rec) {
			pActionsGridData.push(rec.getData()) ;
		}) ;
		this.down('#pActionsGrid').getStore().loadRawData(pActionsGridData) ;
		return ;
	},
	doReload: function() {
		this.loadOrder( this._orderFilerecordId ) ;
	},
	
	
	handleSaveHeader: function(doReload) {
		var formPanel = this.down('#pHeaderForm'),
			form = formPanel.getForm() ;
			  
		var recordData = form.getValues(false,false,false,true) ;
		recordData['adr_postal'] = this.down('#gridAdrPostal').getTabData() ;
		recordData['adr_tel'] = this.down('#gridAdrTel').getTabData() ;
		
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'file_setHeader',
				_is_new: ( this._fileNew ? 1 : 0 ),
				file_filerecord_id: ( this._fileNew ? null : this._fileFilerecordId ),
				data: Ext.JSON.encode(recordData)
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					var error = ajaxResponse.success || 'File not saved !' ;
					Ext.MessageBox.alert('Error',error) ;
					return ;
				}
				var doReload = doReload ;
				this.onSaveHeader(ajaxResponse.id, doReload) ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	onSaveHeader: function(savedId, doReload) {
		this.optimaModule.postCrmEvent('datachange',{}) ;
		
		if( doReload ) {
			this.loadFile(savedId) ;
		}
	},
	
	
	
	openActionPanel: function(actionPanelClass,w,h) {
		if( this._readonlyMode ) {
			return ;
		}
		var postParams = {} ;
		var actionPanel = Ext.create(actionPanelClass,{
			optimaModule: this.optimaModule,
			_fileRecord: this._fileRecord,
			width:w, 
			height:h,
			floating: true,
			draggable: true,
			resizable: true,
			renderTo: this.getEl(),
			tools: [{
				type: 'close',
				handler: function(e, t, p) {
					p.ownerCt.destroy();
				},
				scope: this
			}],
			
			title: 'Action sur dossier'
		});
		
		actionPanel.on('saved',function() {
			this.doReload() ;
		},this) ;
		actionPanel.on('destroy',function(validConfirmPanel) {
			this.getEl().unmask() ;
			this.floatingPanel = null ;
		},this,{single:true}) ;
		
		this.getEl().mask() ;
		
		actionPanel.show();
		actionPanel.getEl().alignTo(this.getEl(), 'c-c?');
		
		this.floatingPanel = actionPanel ;
	},
	
	
	
	
	
	onBeforeDestroy: function() {
		if( this._isDirty ) {
			this.optimaModule.postCrmEvent('datachange',{}) ;
		}
	}
}) ; 
