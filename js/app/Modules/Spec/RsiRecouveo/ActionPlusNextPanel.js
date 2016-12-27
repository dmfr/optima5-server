Ext.define('Optima5.Modules.Spec.RsiRecouveo.ActionPlusNextPanel',{
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
				padding: 10,
				checkboxToggle: true,
				collapsed: false, // fieldset initially collapsed
				title: 'Changement statut',
				items:[{
					flex: 1,
					xtype: 'combobox',
					name: 'status_next',
					fieldLabel: 'Nouveau statut',
					forceSelection: true,
					editable: false,
					store: {
						fields: ['txt'],
						data : [
							{id: '', txt:'<pas de changement>'},
							{id: 'S1_OPEN', txt:'Retour "En cours"'}
						]
					},
					queryMode: 'local',
					displayField: 'txt',
					valueField: 'id'
				}]
			}]
		}) ;
		
		this.callParent() ;
	},
}) ;
