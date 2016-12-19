Ext.define('Optima5.Modules.Spec.RsiRecouveo.ActionAgreeStartForm',{
	extend:'Ext.form.Panel',
	
	_fileRecord: null,
	
	initComponent: function() {
		Ext.apply(this,{
			cls: 'ux-noframe-bg',
			bodyCls: 'ux-noframe-bg',
			bodyPadding: 10,
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			items: [{
				xtype: 'fieldset',
				title: 'Type d\'action',
				defaults: {
					anchor: '100%',
					labelWidth: 80
				},
				items: [{
					flex: 1,
					xtype: 'displayfield',
					fieldLabel: 'Action',
					value: '<b>Promesse de réglement</b>'
				}]
			},{
				xtype: 'fieldset',
				padding: 10,
				title: 'Echéancier',
				layout: {
					type: 'anchor'
				},
				defaults: {
					anchor: '100%',
					labelWidth: 120
				},
				items: [{
					xtype:'numberfield',
					width: 220,
					anchor: '',
					name: 'inv_amount_due',
					hideTrigger:true,
					fieldLabel: 'Montant'
				},{
					xtype: 'combobox',
					name: 'agree_period',
					fieldLabel: 'Périodicité',
					forceSelection: true,
					editable: false,
					store: {
						fields: ['txt'],
						data : [
							{id: '', txt:'-select-'},
							{id: 'SINGLE', txt:'Paiement unique'},
							{id: 'WEEK', txt:'Hebdomadaire'},
							{id: 'MONTH', txt:'Mensuelle'}
						]
					},
					queryMode: 'local',
					displayField: 'txt',
					valueField: 'id',
					listeners: {
						select: this.onSelectPeriod,
						scope: this
					}
				},{
					xtype:'datefield',
					format: 'Y-m-d',
					name: 'agree_date',
					fieldLabel: 'Echéance'
				},{
					xtype:'datefield',
					format: 'Y-m-d',
					name: 'agree_first',
					fieldLabel: 'Première échéance'
				},{
					xtype:'numberfield',
					width: 180,
					anchor: '',
					name: 'agree_count',
					fieldLabel: 'Nb échéances'
				}]
			}],
			buttons: [{
				xtype: 'button',
				text: 'OK',
				handler: function( btn ) {
					this.handleSubmitEvent() ;
				},
				scope: this
			}]
		}) ;
		
		this.callParent() ;
		this.onSelectPeriod();
		
		this.getForm().findField('inv_amount_due').setValue( this._fileRecord.get('inv_amount_due') ) ;
	},
	
	onSelectPeriod: function(s) {
		var form = this.getForm() ;
		
		switch( form.findField('agree_period').getValue() ) {
			case 'SINGLE' :
				form.findField('agree_date').setVisible(true) ;
			  form.findField('agree_first').setVisible(false) ;
			  form.findField('agree_count').setVisible(false) ;
			  break ;
			case 'WEEK' :
			case 'MONTH' :
				form.findField('agree_date').setVisible(false) ;
			  form.findField('agree_first').setVisible(true) ;
			  form.findField('agree_count').setVisible(true) ;
			  break ;
			default :
				form.findField('agree_date').setVisible(false) ;
			  form.findField('agree_first').setVisible(false) ;
			  form.findField('agree_count').setVisible(false) ;
			  break ;
		}
	},
	
	onSelectAdrTelName: function(cmb) {
		var adrName = cmb.getValue(),
			adrField = this.getForm().findField('adrtel_txt') ;
		adrField.reset() ;
		this._fileRecord.adr_tel().each( function(rec) {
			if( rec.get('adr_name') == adrName ) {
				adrField.setValue( rec.get('adr_tel_txt') ) ;
			}
		}) ;
	}
	
}) ;
