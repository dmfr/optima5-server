Ext.define('Optima5.Modules.Spec.RsiRecouveo.FileCreateAgreePanel',{
	extend:'Ext.form.Panel',
	
	_fileRecord: null,
	
	initComponent: function() {
		Ext.apply(this,{
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
					anchor: '50%',
					labelWidth: 120
				},
				items: [{
					xtype:'numberfield',
					width: 220,
					anchor: '',
					name: 'agree_amount',
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
					fieldLabel: 'Echéance'
				},{
					xtype:'datefield',
					format: 'Y-m-d',
					name: 'agree_datefirst',
					fieldLabel: 'Première échéance'
				},{
					xtype:'numberfield',
					width: 180,
					anchor: '',
					name: 'agree_count',
					fieldLabel: 'Nb échéances'
				},{
					xtype: 'checkboxfield',
					name: 'agree_amountfirst_do',
					boxLabel: 'Spécifier 1ere échéance ?'
				},{
					xtype:'numberfield',
					width: 220,
					anchor: '',
					name: 'agree_amountfirst',
					hideTrigger:true,
					fieldLabel: 'Mnt 1ère échéance'
				}]
			},{
				xtype: 'fieldset',
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
					xtype:'textfield',
					readOnly: true,
					name: 'agree_display_amountfirst',
					hideTrigger:true,
					fieldLabel: 'Mnt 1ere échéance'
				},{
					xtype:'textfield',
					readOnly: true,
					name: 'agree_display_amountnext',
					hideTrigger:true,
					fieldLabel: 'Mnt autres échéance'
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
		}) ;
		
		this.callParent() ;
		this.getForm().getFields().each( function(field) {
			field.on('change',function(field) {
				this.onFormChange() ;
			},this) ;
		},this) ;
		this.onFormChange();
	},
	
	onFormChange: function() {
		var form = this.getForm() ;
		
		switch( form.findField('agree_period').getValue() ) {
			case 'NOW' :
				form.findField('agree_date').setVisible(false) ;
				form.findField('agree_datefirst').setVisible(false) ;
				form.findField('agree_count').setVisible(false) ;
				form.findField('agree_amountfirst_do').setVisible(false) ;
			  break ;
			case 'SINGLE' :
				form.findField('agree_date').setVisible(true) ;
				form.findField('agree_datefirst').setVisible(false) ;
				form.findField('agree_count').setVisible(false) ;
				form.findField('agree_amountfirst_do').setVisible(false) ;
				break ;
			case 'WEEK' :
			case 'MONTH' :
				form.findField('agree_date').setVisible(false) ;
				form.findField('agree_datefirst').setVisible(true) ;
				form.findField('agree_count').setVisible(true) ;
				form.findField('agree_amountfirst_do').setVisible(true) ;
				break ;
			default :
				form.findField('agree_date').setVisible(false) ;
				form.findField('agree_datefirst').setVisible(false) ;
				form.findField('agree_count').setVisible(false) ;
				form.findField('agree_amountfirst_do').setVisible(false) ;
				break ;
		}
		
		form.findField('agree_amountfirst').setVisible( 
			form.findField('agree_amountfirst_do').isVisible() && form.findField('agree_amountfirst_do').getValue() ) ;
			  
		// Calcul
		var agree_display_amountfirst = '' ,
			agree_display_amountnext = '' ;
			  
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
					agree_display_amountfirst = amount ;
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
			
			if( formValues.agree_amountfirst_do ) {
				agree_display_amountfirst = formValues.agree_amountfirst ;
				amount -= parseFloat(formValues.agree_amountfirst) ;
				nbStep-- ;
			}
			
			agree_display_amountnext = amount / nbStep ;
			
			break ;
		}
		
		form.setValues({
			agree_display_amountfirst: (Ext.isNumber(agree_display_amountfirst) ? Ext.util.Format.number(agree_display_amountfirst,'0,000.00') : ''),
			agree_display_amountnext: (Ext.isNumber(agree_display_amountnext) ? Ext.util.Format.number(agree_display_amountnext,'0,000.00') : '')
		}) ;
	}
}) ;
