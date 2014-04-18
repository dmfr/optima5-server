Ext.define('Optima5.Modules.Spec.DbsPeople.RhNewEventPanel',{
	extend: 'Ext.form.Panel',
	
	optimaModule: null,
	
	devCfgData: null,
	
	initComponent: function() {
		var me = this ;
		Ext.apply(me,{
			layout: 'anchor',
			fieldDefaults: {
				labelAlign: 'left',
				labelWidth: 70,
				anchor: '100%'
			},
			title: 'Ajout événement',
			frame:false,
			border: false,
			bodyPadding: 10,
			bodyCls: 'ux-noframe-bg',
			cls:'ux-noframe-bg',
			buttons: [{
				text: 'Enregistrer',
				handler: function(){
					if( !this.isValid() ) {
						Ext.MessageBox.alert('Incomplete','Please fill all required data') ;
						return ;
					}
					this.fireEvent('neweventsubmit',this,this.getValues()) ;
				},
				scope: me
			}],
			items:[{
				xtype: 'colorcombo',
				allowBlank: false,
				queryMode: 'local',
				forceSelection: true,
				editable: false,
				displayField: 'eventType_txt',
				valueField: 'eventType_code',
				iconClsField: 'eventType_iconCls',
				store: {
					fields: ['eventType_code','eventType_txt','eventType_iconCls'],
					data : [
						{eventType_code:'CONTRACT',eventType_txt:'Contrat',eventType_iconCls:'op5-spec-dbspeople-icon-contrat'},
						{eventType_code:'ABS',eventType_txt:'Absence',eventType_iconCls:'op5-spec-dbspeople-icon-absence'},
						{eventType_code:'TEAM',eventType_txt:'Chgmt Equipe',eventType_iconCls:'op5-spec-dbspeople-icon-team'},
						{eventType_code:'ROLE',eventType_txt:'Chgmt Rôle',eventType_iconCls:'op5-spec-dbspeople-icon-role'},
						{eventType_code:'WHSE',eventType_txt:'Chgmt Entrepôt',eventType_iconCls:'op5-spec-dbspeople-icon-move'}
					]
				},
				fieldLabel: 'Catégorie',
				name : 'event_type',
				itemId : 'event_type',
				listeners: {
					change:function(cmb, newValue) {
						me.getComponent('event_details').setVisible(true) ;
						me.getComponent('event_details').getComponent('x_code').clearValue() ;
						me.getComponent('event_details').getComponent('x_code').getStore().loadData( Optima5.Modules.Spec.DbsPeople.HelperCache.forTypeGetAll(newValue) ) ;
					},
					scope:me
				}
			},{
				xtype:'fieldset',
				title: 'Détail de l\'événement',
				itemId:'event_details',
				hidden: true,
				items:[{
					xtype: 'checkbox',
					boxLabel: 'Permanent / définitif ?',
					listeners: {
						change:function(cmb, newValue) {
							var dateEndField = me.getComponent('event_details').getComponent('date_end') ;
							dateEndField.setVisible(!newValue) ;
							dateEndField.allowBlank = newValue ;
							if( newValue ) {
								dateEndField.reset() ;
							}
						},
						scope:me
					}
				},{
					xtype: 'datefield',
					allowBlank: false,
					format: 'd/m/Y',
					submitFormat: 'Y-m-d',
					fieldLabel: 'Début',
					name: 'date_start',
					itemId: 'date_start',
					anchor: '',
					width: 170
				},{
					xtype: 'datefield',
					allowBlank: false,
					format: 'd/m/Y',
					submitFormat: 'Y-m-d',
					fieldLabel: 'Fin',
					name: 'date_end',
					itemId: 'date_end',
					anchor: '',
					width: 170
				},{
					xtype: 'combobox',
					allowBlank: false,
					queryMode: 'local',
					forceSelection: true,
					editable: false,
					displayField: 'text',
					valueField: 'id',
					store: {
						fields: ['id','text'],
						data : []
					},
					fieldLabel: 'Affecté à',
					name : 'x_code',
					itemId : 'x_code'
				}]
			}]
		});
		me.callParent() ;
	}
});