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
						labelWidth: 90,
						anchor: '100%'
					},
					items: [Ext.create('Optima5.Modules.Spec.RsiRecouveo.CfgParamField',{
						cfgParam_id: 'ATR_BU',
						cfgParam_emptyDisplayText: 'Select...',
						optimaModule: this.optimaModule,
						name: 'atr_bu',
						allowBlank: false,
						fieldLabel: 'BusinessUnit</b>',
						anchor: '',
						width: 325,
						value: 'BL'
					}),Ext.create('Optima5.Modules.Spec.RsiRecouveo.CfgParamField',{
						cfgParam_id: 'ATR_DIV',
						cfgParam_emptyDisplayText: 'Select...',
						optimaModule: this.optimaModule,
						name: 'atr_div',
						allowBlank: false,
						fieldLabel: 'Divisions</b>',
						anchor: '',
						width: 325,
						value: 'PT'
					}),Ext.create('Optima5.Modules.Spec.RsiRecouveo.CfgParamField',{
						cfgParam_id: 'ATR_SECT',
						cfgParam_emptyDisplayText: 'Select...',
						optimaModule: this.optimaModule,
						name: 'atr_sect',
						allowBlank: false,
						fieldLabel: 'Secteurs</b>',
						anchor: '',
						width: 325,
						value: 'S1'
					}),{
						xtype: 'textfield',
						fieldLabel: '<b># Acheteur</b>',
						anchor: '',
						width: 250,
						name: 'id_dn',
						allowBlank: false,
						value: '9876543210'
					},{
						xtype: 'textfield',
						fieldLabel: 'Nom / Société',
						value: 'Solvay SA (SOLB.BE)',
						name: 'ref_po'
					},{
						xtype: 'textfield',
						fieldLabel: 'SIREN/SIRET',
						anchor: '',
						width: 250,
						name: 'ref_invoice',
						value: '4657898891 15616',
					},{
						xtype: 'textarea',
						fieldLabel: '<b>Adresse</b>',
						name: 'txt_location_full',
						value: 'Quai Albert 1er\n75008 PARIS\nFRANCE'
					}]
				},{
					flex: 1,
					title: 'Contacts',
					xtype: 'damsembeddedgrid',
					columns: [{
						text: 'Contact',
						dataIndex: 'contact'
					},{
						text: 'Telephone',
						dataIndex: 'telephone'
					},{
						text: 'Status',
						dataIndex: 'status',
						renderer: function(v,metaData) {
							if( v=='OK' ) {
								metaData.tdCls += ' op5-spec-dbstracy-kpi-ok' ;
							} else {
								metaData.tdCls += ' op5-spec-dbstracy-kpi-nok' ;
							}
						}
					}],
					tabData: [{
						status: 'OK',
						telephone: '<b>+33 6 83 82 01 21</b>',
						contact: 'DAF groupe'
					},{
						status: '',
						telephone: '<b>+33 6 55 44 33 22</b>',
						contact: 'Expert comptable'
					}]
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
					xtype: 'treepanel',
					rootVisible: false,
					useArrows: true,
					itemId: 'pStepsGrid',
					columns: [{
						xtype: 'treecolumn',
						dataIndex: 'action_txt',
						text: 'Action',
						width: 165,
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
			}]
		}) ;
		
		this.callParent() ;
		/*
		if( this._readonlyMode ) {
			this.down('toolbar').setVisible(false) ;
		}
		
		this.on('afterrender', function() {
			if( this._orderNew ) {
				this.newOrder() ;
			} else {
				this.loadOrder( this._orderFilerecordId ) ;
			}
		},this) ;
		this.on('beforedestroy',this.onBeforeDestroy,this) ;
		
		this.mon(this.optimaModule,'op5broadcast',this.onCrmeventBroadcast,this) ;
		*/
	},
}) ; 
