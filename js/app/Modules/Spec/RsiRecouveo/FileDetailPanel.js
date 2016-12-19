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
Ext.define('RsiRecouveoFileDetailFactureModel', {
    extend: 'Ext.data.Model',
    fields: [
        {name: 'libelle',  type: 'string'},
		  {name: 'lettrage', type: 'string'},
		  {name: 'debit',  type: 'string'},
		  {name: 'credit', type:'string'}
     ]
});

Ext.define('Optima5.Modules.Spec.RsiRecouveo.FileDetailPanel',{
	extend:'Ext.window.Window',
	
	requires: [
		'Optima5.Modules.Spec.RsiRecouveo.CfgParamField'
	],
	
	_readonlyMode: false,
	
	initComponent: function() {
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
			value: 'Solvay SA (SOLB.BE)',
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
				title: 'Factures',
				xtype: 'grid',
				columns: [{
					text: 'Libellé',
					dataIndex: 'libelle',
					width: 170
				},{
					text: 'Lettrage',
					dataIndex: 'lettrage',
					width: 80
				},{
					text: 'Débit',
					dataIndex: 'debit',
					align: 'right',
					width: 80
				},{
					text: 'Crédit',
					dataIndex: 'credit',
					align: 'right',
					width: 80
				}],
				store: {
					model: 'RsiRecouveoFileDetailFactureModel',
					data: [{
						libelle: 'Reglement CA-151-15151',
						lettrage: '',
						credit: '<b>750.00',
						debit: ''
					},{
						libelle: 'Facuture 123456',
						lettrage: '',
						debit: '<b>320.25',
						credit: ''
					},{
						libelle: 'Facuture TA8745',
						lettrage: '',
						debit: '<b>2985.00',
						credit: ''
					},{
						libelle: 'Reglement CA-999-0000',
						lettrage: '<b>AAC',
						credit: '<b>4000.00',
						debit: ''
					},{
						libelle: 'Facuture XX1222',
						lettrage: '<b>AAC',
						debit: '<b>4000.00',
						credit: ''
					}]
				}
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
					xtype: 'treepanel',
					rootVisible: false,
					useArrows: true,
					itemId: 'pStepsGrid',
					columns: [{
						xtype: 'treecolumn',
						dataIndex: 'action_txt',
						text: 'Action',
						width: 165
					},{
						text: 'Date',
						width: 100,
						dataIndex: 'action_date'
					},{
						text: 'Result',
						width: 200,
						dataIndex: 'action_result',
						renderer: function(v,metaData,r) {
							if( r.get('action_result_pending') ) {
								metaData.tdCls += ' op5-spec-dbstracy-files-nowarning' ;
							}
							if( r.get('action_result_ok') ) {
								metaData.tdCls += ' op5-spec-dbstracy-kpi-ok' ;
							}
							return v ;
						}
					}],
					store: {
						model: 'RsiRecouveoFileDetailActionsTreeModel',
						root:{
							root: true,
							expanded: true,
							children: [{
								action_txt: '<b>3 - Outils juridiques</b>',
								expanded: true,
								children: [{
									leaf: true,
									action_txt: 'RDV Tel huissier',
									action_date: '16/11/2016 09:30',
									action_result_pending: true,
									action_result_ok: false
								},{
									leaf: true,
									action_txt: 'Régularisation partielle',
									action_date: '11/11/2016',
									action_result: 'Virement AAC : <b>750.00€<b>'
								},{
									leaf: true,
									action_txt: 'Courrier Avocat',
									action_date: '11/11/2016',
									action_result_ok: true
								}]
							},{
								action_txt: '<b>2 - Relance amiable</b>',
								expanded: true,
								children: [{
									leaf: true,
									action_txt: 'RDV téléphonique',
									action_date: '10/11/2016 17h14',
									action_result: '<i>On s\'est fait jeter</i>'
								},{
									leaf: true,
									action_txt: 'Relance 2',
									action_date: '08/11/2016',
									action_result: '<i>Pas le bon interlocuteur</i>'
								},{
									leaf: true,
									action_txt: 'Relance 1',
									action_date: '05/11/2016',
									action_result: '<i>Promesse de règlement</i>'
								}]
							},{
								action_txt: '<b>1 - Prise de contact</b>',
								expanded: true,
								children: [{
									leaf: true,
									action_txt: 'Appel 2',
									action_date: '04/11/2016',
									action_result_ok: true
								},{
									leaf: true,
									action_txt: 'Appel 1',
									action_date: '01/11/2016',
									action_result: '<i>Mise à jour contacts</i>'
								}]
							}]
						},
						proxy: {
							type: 'memory',
							reader: {
								type: 'json'
							}
						}
					}
				},{
					region: 'south',
					flex: 1,
					itemId: 'pEventsGrid',
					title: 'Action result / New action',
					collapsible: true,
					collapsed: false,
					xtype: 'form',
					border: false,
					bodyCls: 'ux-noframe-bg',
					bodyPadding: 8,
					layout: 'anchor',
					fieldDefaults: {
						labelWidth: 75,
						anchor: '100%'
					},
					items: [{
						xtype: 'datetimefield',
						fieldLabel: 'Date / heure',
						format: 'Y-m-d',
						name: 'event_user',
						value: new Date()
					},{
						anchor: '',
						width: 275,
						xtype: 'combobox',
						name: 'group_date_type',
						fieldLabel: 'Issue',
						forceSelection: true,
						editable: false,
						store: {
							fields: ['lib'],
							data : [
								{lib:'Appel effectué'},
								{lib:'Echec appel'},
								{lib:'Reporté'},
								{lib:'Promesse'}
							]
						},
						queryMode: 'local',
						displayField: 'lib',
						valueField: 'mode'
					},{
						xtype: 'textarea',
						fieldLabel: 'Observation',
						name: 'event_txt'
					}],
					buttons: [{
						xtype: 'button',
						text: 'OK',
						handler: function( btn ) {
							this.handleSubmitEvent() ;
						},
						scope: this
					}]
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
		return ;
		
		//gSteps
		if( this._readonlyMode ) {
			// filter steps
			var orderStepRecords_toRemove = [] ;
			orderRecord.steps().each( function(orderStepRecord) {
				var stepCode = orderStepRecord.get('step_code'),
					stepRecord = Optima5.Modules.Spec.DbsTracy.HelperCache.getStepByStep( stepCode ) ;
				if( stepRecord.is_private ) {
					orderStepRecords_toRemove.push(orderStepRecord) ;
				}
			}) ;
			if( orderStepRecords_toRemove.length > 0 ) {
				orderRecord.steps().remove(orderStepRecords_toRemove) ;
			}
		}
		this.down('#pStepsGrid').getEl().unmask() ;
		this.down('#pStepsGrid').getStore().loadRawData(orderRecord.steps().getRange()) ;
		
		//gEvents
		var tmpData = [] ;
		orderRecord.events().each( function(rec) {
			tmpData.push(rec.getData()) ;
		}) ;
		this.down('#pEventsGrid').getEl().unmask() ;
		this.down('#pEventsGrid').getStore().loadData(tmpData) ;
		if( tmpData.length > 0 ) {
			this.down('#pEventsGrid').expand() ;
		}
		
		//gAttachments
		this.down('#pAttachments').getEl().unmask() ;
		this.down('#pAttachments').setOrderRecord(orderRecord) ;
		
		// Title
		this.setTitle('Order: '+orderRecord.get('id_soc')+'/'+orderRecord.get('id_dn')) ;
		
		// Validate steps menu
		var tbValidateMenu = this.down('#tbValidate').menu ;
		tbValidateMenu.removeAll() ;
		tbValidateMenuItems = [] ;
		var curFlow = Optima5.Modules.Spec.DbsTracy.HelperCache.getOrderflow( orderRecord.get('flow_code') );
		if( curFlow ) {
			Ext.Array.each( curFlow.steps, function(curStep) {
				if( !curStep.prompt_order ) {
					return ;
				}
				tbValidateMenuItems.push({
					_stepCode: curStep.step_code,
					text: curStep.desc_txt,
					iconCls:'op5-sdomains-menu-updateschema',
					handler: function(menuitem) {
						this.handleSaveHeader( menuitem._stepCode ) ;
					},
					scope: this
				});
			},this) ;
		}
		tbValidateMenu.add(tbValidateMenuItems) ;
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
	
	
	
	
	
	
	
	
	onBeforeDestroy: function() {
		if( this._isDirty ) {
			this.optimaModule.postCrmEvent('datachange',{}) ;
		}
	}
}) ; 
