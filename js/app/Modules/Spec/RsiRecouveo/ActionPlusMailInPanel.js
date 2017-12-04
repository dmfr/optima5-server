Ext.define('Optima5.Modules.Spec.RsiRecouveo.ActionPlusMailInPanel',{
	extend:'Ext.form.Panel',
	
	requires: ['Optima5.Modules.Spec.RsiRecouveo.AdrbookTypeContainer'],
	
	_fileRecord: null,
	
	initComponent: function() {
		Ext.apply(this,{
			bodyCls: 'ux-noframe-bg',
			bodyPadding: 0,
			layout: {
				type: 'hbox',
				align: 'stretch'
			},
			items: [{
				flex: 1,
				xtype: 'fieldset',
				title: 'Type d\'action',
				defaults: {
					anchor: '100%',
					labelWidth: 80
				},
				items: [{
					xtype: 'displayfield',
					fieldLabel: 'Action',
					name: 'action_txt',
					value: ''
				},{
					hidden: true,
					xtype: 'displayfield',
					fieldLabel: 'Prévue le',
					name: 'action_sched',
					value: '',
					listeners: {
						change: function(field,val) {
							field.setVisible( !Ext.isEmpty(val) ) ;
						}
					}
				},Ext.create('Optima5.Modules.Spec.RsiRecouveo.AttachmentsFieldPanel',{
					name: 'attachments',
					optimaModule: this.optimaModule
				})]
			},{
				xtype: 'box',
				width: 16
			},{
				flex: 1,
				xtype: 'fieldset',
				padding: 10,
				title: 'Compte-rendu',
				layout: {
					type: 'anchor'
				},
				defaults: {
					anchor: '100%',
					labelWidth: 80
				},
				items: [{
					xtype: 'textarea',
					name: 'txt',
					height: 150
				}]
			}]
		}) ;
		
		this.callParent() ;
		this.getForm().setValues({
			adr_type: 'POSTAL'
		});
	},
	onSelectAdrType: function() {
		var adrType = this.getForm().getValues()['adr_type'] ;
		var parentCnt = this.down('#cntAdr') ;
		parentCnt.removeAll() ;
		if( !adrType ) {
			return ;
		}
		parentCnt.add(Ext.create('Optima5.Modules.Spec.RsiRecouveo.AdrbookTypeContainer',{
			//xtype: 'container',
			itemId: 'cntAdr'+adrType,
			
			optimaModule: this.optimaModule,
			_accountRecord : this._accountRecord,
			
			_adrType: adrType
		})) ;
	}
}) ;
