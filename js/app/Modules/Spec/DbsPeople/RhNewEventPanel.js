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
						var loadData = [],
							availablesWhses, availableRoles ;
						Ext.Array.each( Optima5.Modules.Spec.DbsPeople.HelperCache.forTypeGetAll(newValue), function(dataRow) {
							switch( newValue ) {
								case 'WHSE' :
									if( availablesWhses==null ) {
										availablesWhses = [] ;
										Ext.Array.each( Optima5.Modules.Spec.DbsPeople.HelperCache.forTypeGetAll('WHSE'), function(whseRow) {
											if( !Optima5.Modules.Spec.DbsPeople.HelperCache.authHelperQueryWhse(whseRow.id) ) {
												return ;
											}
											availablesWhses.push(whseRow.id) ;
										}) ;
									}
									if( !Ext.Array.contains( availablesWhses, dataRow.id ) ) {
										return ;
									}
									break ;
								case 'ROLE' :
									if( availableRoles==null ) {
										availableRoles = [] ;
										Ext.Array.each( Optima5.Modules.Spec.DbsPeople.HelperCache.forTypeGetAll('WHSE'), function(whseRow) {
											if( !Optima5.Modules.Spec.DbsPeople.HelperCache.authHelperQueryWhse(whseRow.id) ) {
												return ;
											}
											availableRoles.push( Optima5.Modules.Spec.DbsPeople.HelperCache.links_role_getForWhse(whseRow.id) ) ;
										}) ;
										availableRoles = Ext.Array.union.apply(null,availableRoles) ;
									}
									if( !Ext.Array.contains( availableRoles, dataRow.id ) ) {
										return ;
									}
									break ;
								default:
									break ;
							}
							loadData.push(dataRow) ;
						});
						
						me.getComponent('event_details').setVisible(true) ;
						me.getComponent('event_details').getComponent('x_code').clearValue() ;
						me.getComponent('event_details').getComponent('x_code').getStore().loadData( loadData ) ;
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
					startDay: 1,
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
					startDay: 1,
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