Ext.define('Optima5.Modules.Spec.RsiRecouveo.FileCreateAgreePanel',{
	extend:'Ext.tab.Panel',
	
	requires: [
		'Optima5.Modules.Spec.RsiRecouveo.AgreeSummaryPanel'
	],
	
	_fileRecord: null,
	
	initComponent: function() {
		Ext.apply(this,{
			items: [{
				itemId: 'formWizard',
				title: 'Assistant',
				xtype: 'form',
				cls: 'ux-noframe-bg',
				bodyCls: 'ux-noframe-bg',
				bodyPadding: 0,
				layout: 'anchor',
				items: [{
					xtype: 'fieldset',
					padding: 10,
					title: 'Echéancier',
					layout: {
						type: 'anchor'
					},
					defaults: {
						anchor: '60%',
						labelWidth: 120
					},
					items: [{
						xtype:'displayfield',
						width: 220,
						anchor: '',
						name: 'records_amount',
						hideTrigger:true,
						fieldLabel: 'Montant sélect.'
					},{
						xtype:'numberfield',
						width: 220,
						anchor: '',
						name: 'agree_amount',
						hideTrigger:true,
						fieldLabel: 'Montant échéancier',
						allowBlank: false
					},{
						xtype: 'combobox',
						name: 'agree_period',
						fieldLabel: 'Périodicité',
						allowBlank: false,
						forceSelection: true,
						editable: false,
						store: {
							fields: ['txt'],
							data : [
								{id: '', txt:'-select-'},
								{id: 'NOW', txt:'Paiement immédiat VPC'},
								{id: 'SINGLE', txt:'Paiement unique'},
								{id: 'WEEK', txt:'Hebdomadaire'},
								{id: 'MONTH', txt:'Mensuelle'}
							]
						},
						anchor: '100%',
						queryMode: 'local',
						displayField: 'txt',
						valueField: 'id'
					},{
						xtype:'datefield',
						format: 'Y-m-d',
						name: 'agree_date',
						fieldLabel: 'Echéance',
						allowBlank: false,
						minValue: new Date()
					},{
						xtype:'datefield',
						format: 'Y-m-d',
						name: 'agree_datefirst',
						fieldLabel: 'Première échéance',
						allowBlank: false,
						minValue: new Date()
					},{
						xtype:'numberfield',
						width: 180,
						anchor: '',
						name: 'agree_count',
						allowBlank: false,
						fieldLabel: 'Nb échéances'
					}]
				},{
					xtype: 'fieldset',
					itemId: 'fsCalc',
					padding: 10,
					title: 'Calcul échéances',
					layout: {
						type: 'anchor'
					},
					defaults: {
						anchor: '50%',
						labelWidth: 120
					},
					items: [{
						xtype:'numberfield',
						name: 'agree_set_amountfirst',
						hideTrigger:true,
						fieldLabel: 'Mnt 1ere échéance'
					},{
						xtype:'displayfield',
						readOnly: true,
						name: 'agree_display_amountnext',
						hideTrigger:true,
						fieldLabel: 'Mnt autres échéance'
					},{
						xtype:'numberfield',
						name: 'agree_set_amountlast',
						hideTrigger:true,
						fieldLabel: 'Mnt dernière éch.'
					}]
				},{
					xtype: 'fieldset',
					padding: 8,
					title: 'Commentaire',
					defaults: {
						anchor: '100%',
						labelWidth: 80
					},
					items: [{
						xtype: 'textarea',
						name: 'agree_txt',
						height: 75
					}]
				}]
			},Ext.create('Optima5.Modules.Spec.RsiRecouveo.AgreeSummaryPanel',{
				itemId: 'formSummary',
				title: 'Echeancier',
				cls: 'ux-noframe-bg',
				bodyCls: 'ux-noframe-bg',
				bodyPadding: 0,
				
				optimaModule: this.optimaModule
			})]
		}) ;
		
		this.callParent() ;
		this.setActiveTab(0) ;
		this.getForm().getFields().each( function(field) {
			field.on('change',function(field) {
				this.onFormChange(field) ;
			},this) ;
		},this) ;
		this.onFormChange();
	},

	getForm: function() {
		return this.down('#formWizard').getForm() ;
	},
	
	onFormChange: function(field) {
		var form = this.getForm() ;
		
		switch( field && field.getName() ) {
			case 'agree_count' :
			case 'agree_amount' :
			case 'agree_period' :
				form.findField('agree_set_amountfirst').reset() ;
				form.findField('agree_set_amountlast').reset() ;
				break ;
		}
		
		switch( form.findField('agree_period').getValue() ) {
			case 'NOW' :
				form.findField('agree_date').setVisible(false) ;
				form.findField('agree_datefirst').setVisible(false) ;
				form.findField('agree_count').setVisible(false) ;
			  break ;
			case 'SINGLE' :
				form.findField('agree_date').setVisible(true) ;
				form.findField('agree_datefirst').setVisible(false) ;
				form.findField('agree_count').setVisible(false) ;
				break ;
			case 'WEEK' :
			case 'MONTH' :
				form.findField('agree_date').setVisible(false) ;
				form.findField('agree_datefirst').setVisible(true) ;
				form.findField('agree_count').setVisible(true) ;
				break ;
			default :
				form.findField('agree_date').setVisible(false) ;
				form.findField('agree_datefirst').setVisible(false) ;
				form.findField('agree_count').setVisible(false) ;
				break ;
		}
		
		var nbStep ;
		switch( form.findField('agree_period').getValue() ) {
			case 'NOW' :
				nbStep = 0 ;
			  break ;
			case 'SINGLE' :
				nbStep = 1 ;
				break ;
			case 'WEEK' :
			case 'MONTH' :
				nbStep = form.findField('agree_count').getValue() ;
				break ;
			default :
				nbStep = -1 ;
				break ;
		}
		
		this.down('#fsCalc').setVisible( nbStep!=0 ) ;
		form.findField('agree_set_amountfirst').setVisible( nbStep>1 ) ;
		form.findField('agree_set_amountlast').setVisible( nbStep>2 ) ;
		
			  
		// Calcul
		var agree_display_amountnext = '' ;
			  
		outer_loop:
		while(true) {
			var formValues = form.getValues(false,false,false,true) ;
			var amount = parseFloat(formValues.agree_amount),
				nbStep = 0 ;
			if( amount == NaN ) {
				break outer_loop;
			}
			switch( formValues.agree_period ) {
				case 'SINGLE' :
					agree_display_amountnext = amount ;
					break outer_loop;
				case 'WEEK' :
				case 'MONTH' :
						nbStep = parseInt(formValues.agree_count) ;
						break ;
				default :
					break outer_loop;
			}
			if( nbStep==NaN || nbStep < 1 ) {
				break ;
			}
			
			if( !Ext.isEmpty(formValues.agree_set_amountfirst) && formValues.agree_set_amountfirst>0 ) {
				amount -= parseFloat(formValues.agree_set_amountfirst) ;
				nbStep-- ;
			}
			if( !Ext.isEmpty(formValues.agree_set_amountlast) && formValues.agree_set_amountlast>0 ) {
				amount -= parseFloat(formValues.agree_set_amountlast) ;
				nbStep-- ;
			}
			
			agree_display_amountnext = amount / nbStep ;
			
			break ;
		}
		
		form.setValues({
			agree_display_amountnext: (Ext.isNumber(agree_display_amountnext) ? Ext.util.Format.number(agree_display_amountnext,'0,000.00') : '')
		}) ;
	}
}) ;
