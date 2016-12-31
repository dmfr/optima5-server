Ext.define('Optima5.Modules.Spec.RsiRecouveo.ActionAgreeStartForm',{
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
	}
}) ;
