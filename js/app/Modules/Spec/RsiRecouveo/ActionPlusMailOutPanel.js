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
						items: Ext.create('Optima5.Modules.Spec.RsiRecouveo.AdrbookTypeContainer',{
							//xtype: 'container',
							itemId: 'cntAdrPost',
							
							optimaModule: this.optimaModule,
							_accountRecord : this._accountRecord,
							
							_adrType: 'POSTAL',
							_showNew: true,
							_showResult: false,
							_showValidation: false
						})
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
						items: Ext.create('Optima5.Modules.Spec.RsiRecouveo.AdrbookTypeContainer',{
							//xtype: 'container',
							itemId: 'cntAdrTel',
							
							optimaModule: this.optimaModule,
							_accountRecord : this._accountRecord,
							
							_adrType: 'TEL',
							_showNew: true,
							_showResult: false,
							_showValidation: false
						})
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
						items: Ext.create('Optima5.Modules.Spec.RsiRecouveo.AdrbookTypeContainer',{
							//xtype: 'container',
							itemId: 'cntAdrMail',
							
							optimaModule: this.optimaModule,
							_accountRecord : this._accountRecord,
							
							_adrType: 'EMAIL',
							_showNew: true,
							_showResult: false,
							_showValidation: false
						})
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
	}
}) ;
