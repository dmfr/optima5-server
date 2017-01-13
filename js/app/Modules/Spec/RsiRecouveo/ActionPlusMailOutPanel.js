Ext.define('Optima5.Modules.Spec.RsiRecouveo.ActionPlusMailOutPanel',{
	extend:'Ext.form.Panel',
	
	_fileRecord: null,
	
	initComponent: function() {
		Ext.apply(this,{
			bodyCls: 'ux-noframe-bg',
			bodyPadding: 0,
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			items: [{
				xtype: 'fieldset',
				title: 'Type d\'action',
				layout: {
					type: 'hbox',
					align: 'begin'
				},
				defaults: {
					anchor: '100%',
					labelWidth: 80
				},
				items: [{
					flex: 1,
					xtype: 'displayfield',
					fieldLabel: 'Action',
					value: '<b>Courrier / Mail Sortant</b>'
				},{
					flex: 1,
					xtype: 'combobox',
					name: 'mail_model',
					fieldLabel: 'Modèle lettre',
					forceSelection: true,
					editable: false,
					store: {
						fields: ['txt'],
						data : [
							{id: 'RELANCE_STD', txt:'Relance Standard'}
						]
					},
					queryMode: 'local',
					displayField: 'txt',
					valueField: 'id'
				}]
			},{
				xtype: 'container',
				layout: {
					type: 'hbox',
					align: 'begin'
				},
				items: [{
					xtype: 'container',
					flex: 1,
					layout: {
						type: 'anchor'
					},
					defaults: {
						anchor: '100%'
					},
					items: [{
						xtype: 'fieldset',
						layout: {
							type: 'anchor'
						},
						defaults: {
							anchor: '100%'
						},
						checkboxToggle: true,
						collapsed: false, // fieldset initially collapsed
						title: 'Envoi postal',
						items: [{
							xtype: 'combobox',
							itemId: 'selectAdrName',
							fieldLabel: 'Destinataires',
							forceSelection: true,
							editable: false,
							store: {
								fields: ['adr_name'],
								data : []
							},
							queryMode: 'local',
							displayField: 'adr_name',
							valueField: 'adr_name',
							listeners: {
								select: this.onSelectAdrName,
								scope: this
							}
						},{
							xtype: 'textarea',
							name: 'adrpost_txt',
							fieldLabel: 'Adr.Envoi'
						}]
					},{
						xtype: 'fieldset',
						layout: {
							type: 'anchor'
						},
						defaults: {
							anchor: '100%'
						},
						checkboxToggle: true,
						collapsed: true, // fieldset initially collapsed
						title: 'SMS',
						items: [{
							xtype: 'combobox',
							itemId: 'selectAdrTelName',
							fieldLabel: 'Destinataires',
							forceSelection: true,
							editable: false,
							store: {
								fields: ['adr_name'],
								data : []
							},
							queryMode: 'local',
							displayField: 'adr_name',
							valueField: 'adr_name',
							listeners: {
								select: this.onSelectAdrTelName,
								scope: this
							}
						},{
							xtype: 'textfield',
							name: 'adrtel_txt',
							fieldLabel: 'No.Mobile'
						}]
					},{
						xtype: 'fieldset',
						layout: {
							type: 'anchor'
						},
						defaults: {
							anchor: '100%'
						},
						checkboxToggle: true,
						collapsed: true, // fieldset initially collapsed
						title: 'Email',
						items: [{
							xtype: 'textfield',
							name: 'adrmail_email',
							fieldLabel: 'Email'
						}]
					}]
				},{
					xtype: 'box',
					width: 16
				},{
					flex:1,
					xtype: 'fieldset',
					padding: 10,
					title: 'Paragraphe additionnel',
					layout: {
						type: 'anchor'
					},
					defaults: {
						anchor: '100%',
						labelWidth: 80
					},
					items: [{
						xtype: 'textarea',
						name: 'mail_txt',
						height: 150
					}]
				}]
			}]
		}) ;
		
		this.callParent() ;
		
		
		var adrNames = [] ;
		this._accountRecord.adr_postal().each( function(rec) {
			adrNames.push({adr_name: rec.get('adr_name')}) ;
		}) ;
		this.down('#selectAdrName').getStore().loadData(adrNames) ;
		
		var adrNames = [] ;
		this._accountRecord.adr_tel().each( function(rec) {
			adrNames.push({adr_name: rec.get('adr_name')}) ;
		}) ;
		this.down('#selectAdrTelName').getStore().loadData(adrNames) ;
	},
	
	onSelectAdrName: function(cmb) {
		var adrName = cmb.getValue(),
			adrField = this.getForm().findField('adrpost_txt') ;
		adrField.reset() ;
		this._accountRecord.adr_postal().each( function(rec) {
			if( rec.get('adr_name') == adrName ) {
				adrField.setValue( rec.get('adr_postal_txt') ) ;
			}
		}) ;
	},
	
	onSelectAdrTelName: function(cmb) {
		var adrName = cmb.getValue(),
			adrField = this.getForm().findField('adrtel_txt') ;
		adrField.reset() ;
		this._accountRecord.adr_tel().each( function(rec) {
			if( rec.get('adr_name') == adrName ) {
				adrField.setValue( rec.get('adr_tel_txt') ) ;
			}
		}) ;
	}
}) ;
