Ext.define('Optima5.Modules.Spec.DbsEmbralam.LivePanel',{
	extend:'Ext.panel.Panel',
	initComponent: function() {
		Ext.apply(this,{
			bodyCls: 'ux-noframe-bg',
			layout: {
				type: 'hbox',
				align: 'stretch'
			},
			items:[{
				border: false,
				flex:1,
				xtype: 'form',
				bodyCls: 'ux-noframe-bg',
				bodyPadding: 15,
				layout:'anchor',
				fieldDefaults: {
					labelWidth: 120,
					anchor: '100%'
				},
				items:[{
					xtype:'fieldset',
					title: 'Paramètres Adressage',
					items:[{
						xtype: 'textfield',
						fieldLabel: 'Article / Code SKU'
					},{
						xtype: 'textfield',
						fieldLabel: 'Batch code'
					},{
						xtype: 'numberfield',
						fieldLabel: 'Quantité',
						value: 1,
						anchor: '',
						width: 190
					}]
				},{
					anchor: '100%',
					xtype: 'container',
					layout: 'hbox',
					defaults: {
						iconAlign: 'top',
						width: 80,
						padding: 10
					},
					items:[{
						xtype:'button',
						text: 'Valider',
						icon: 'images/op5img/ico_ok_16.gif'
					},{
						xtype:'box',
						width: 16
					},{
						xtype:'button',
						text: 'Autre Adr.',
						icon: 'images/op5img/ico_reload_small.gif'
					},{
						xtype:'box',
						width: 16
					},{
						xtype:'button',
						text: 'Supprimer',
						icon: 'images/op5img/ico_delete_16.gif'
					}]
				},{
					margin: '20 0 10 0',
					xtype:'fieldset',
					title: 'Résultat Adressage',
					items:[{
						padding: 10,
						xtype: 'displayfield',
						fieldLabel: '<b>Adresse</b>',
						labelStyle: 'font-size:16px',
						fieldStyle: 'font-size:20px',
						value: 'XXXXXX'
					}]
				},{
					anchor: '100%',
					xtype: 'container',
					layout: 'hbox',
					defaults: {
						iconAlign: 'top',
						width: 120,
						padding: 10
					},
					items:[{
						xtype:'button',
						text: 'Impression',
						icon: 'images/op5img/ico_print_16.png'
					}]
				}]
				
			},{
				
				flex: 1,
				xtype: 'grid',
				title: 'Adressages récents',
				store: {
					fields:['id'],
					data:[]
				},
				columns: [{
					width: 24
				},{
					width: 24
				},{
					dataIndex: 'mvt_date',
					text: 'Date',
					width: 80
				},{
					dataIndex: 'adr_id',
					text: 'Adresse',
					width: 90
				},{
					dataIndex: 'inv_prod',
					text: 'Article',
					width: 90
				},{
					dataIndex: 'inv_batch',
					text: 'BatchCode',
					width: 100
				},{
					dataIndex: 'mvt_qty',
					text: 'Qty IN',
					align: 'right',
					width: 60
				}]
			}]
		});
		this.callParent();
	}
});