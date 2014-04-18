Ext.define('DbsPeopleRhPeopleEventModel', {
    extend: 'Ext.data.Model',
	 idProperty: 'event_id',
    fields: [
        {name: 'event_id',   type: 'int'},
        {name: 'event_type',   type: 'string'},
        {name: 'x_code',   type: 'string'},
        {name: 'date_start',   type: 'date'},
        {name: 'date_end',   type: 'date', useNull:true}
     ]
});

Ext.define('Optima5.Modules.Spec.DbsPeople.RhFormPanel',{
	extend: 'Ext.panel.Panel',
	requires: [
		'Optima5.Modules.Spec.DbsPeople.RhNewEventPanel'
	],
	
	optimaModule: null,
	
	peopleCode: null,
	peopleRecord: null,
	
	initComponent: function() {
		var me = this ;
		Ext.apply(me,{
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			items:[{
				height: 190,
				xtype: 'form',
				layout: 'anchor',
				fieldDefaults: {
					labelAlign: 'left',
					labelWidth: 70,
					anchor: '100%'
				},
				frame:false,
				border: false,
				bodyPadding: 10,
				bodyCls: 'ux-noframe-bg',
				items:[{
					xtype:'textfield',
					fieldLabel: 'Full name',
					name: 'people_name'
				},{
					xtype:'textfield',
					fieldLabel: 'Tech ID.',
					name: 'people_techid',
					anchor: '',
					width: 140
				},{
					xtype:'fieldset',
					title: 'Situation actuelle (instant T)',
					defaults: {
						margin: 2,
						fieldBodyCls: '' // Otherwise height would be set at 22px
					},
					items:[{
						xtype: 'displayfield',
						fieldLabel: 'Contrat',
						fieldStyle: 'font-weight: bold',
						name: 'contract_txt'
					},{
						xtype: 'displayfield',
						fieldLabel: 'Entrepôt',
						fieldStyle: 'font-weight: bold',
						name: 'whse_txt'
					},{
						xtype: 'displayfield',
						fieldLabel: 'Equipe',
						fieldStyle: 'font-weight: bold',
						name: 'team_txt'
					},{
						xtype: 'displayfield',
						fieldLabel: 'Role',
						fieldStyle: 'font-weight: bold',
						name: 'role_txt',
					}]
				}]
			},{
				flex:1,
				xtype:'grid',
				title: 'Carnet de l\'employé',
				tbar: [{
					itemId: 'add',
					text: 'Add',
					iconCls: 'icon-add',
					handler: function(){
						this.openNewEvent() ;
					},
					scope: this,
					menu: []
				}, '-', {
					itemId: 'delete',
					text: 'Delete',
					iconCls: 'icon-delete',
					disabled: true,
					handler: function(btn) {
						var selectedRecord = btn.up('grid').getView().getSelectionModel().getSelection()[0];
						if( selectedRecord ) {
							this.handleEventDelete( selectedRecord.data ) ;
						}
					},
					scope: this
				}],
				columns:{
					defaults: {
						menuDisabled: true,
						draggable: false,
						sortable: false,
						hideable: false,
						resizable: false
					},
					items: [{
						text: '',
						width: 20,
						sortable: false,
						dataIndex: 'event_type',
						menuDisabled: true,
						renderer: function( value, metadata )
						{
							switch( value ) {
								case 'WHSE' :
									value = 'op5-spec-dbspeople-icon-move' ;
									break ;
								case 'TEAM' :
									value = 'op5-spec-dbspeople-icon-team' ;
									break ;
								case 'ROLE' :
									value = 'op5-spec-dbspeople-icon-role' ;
									break ;
								case 'ABS' :
									value = 'op5-spec-dbspeople-icon-absence' ;
									break ;
								case 'CONTRACT' :
									value = 'op5-spec-dbspeople-icon-contrat' ;
									break ;
									
								default :
									return value ;
							}
							metadata.tdCls = value ;
							return '' ;
						}
					},{
						width: 160,
						text:'Evenement',
						renderer: function(v,m,record) {
							var str = '' ;
							switch( record.data.event_type ) {
								case 'WHSE' :
									str += '<b>To</b>:&#160;' ;
									break ;
								case 'TEAM' :
									str += '<b>Team</b>:&#160;' ;
									break ;
								case 'ROLE' :
									str += '<b>Role</b>:&#160;' ;
									break ;
								case 'CONTRACT' :
									str += '<b>Contrat</b>:&#160;' ;
									break ;
								case 'ABS' :
									str += '' ;
									break ;
								
								default :
									return "<b>undef??</b>" ;
							}
							str += Optima5.Modules.Spec.DbsPeople.HelperCache.forTypeGetById(record.data.event_type,record.data.x_code).text ;
							return str ;
						}
					},{
						text:'Start',
						dataIndex:'date_start',
						xtype: 'datecolumn',
						format:'D d/m/Y'
					},{
						text:'Fin',
						dataIndex:'date_end',
						renderer: function(v) {
							if( v == null ) {
								return "<b>permanent</b>" ;
							}
							return Ext.Date.format( v, 'D d/m/Y' ) ;
						}
					}]
				},
				store: {
					autoload: false,
					model: 'DbsPeopleRhPeopleEventModel',
					proxy: this.optimaModule.getConfiguredAjaxProxy({
						extraParams : {
							_moduleId: 'spec_dbs_people',
							_action: 'RH_getPeopleEvents',
							people_code: null
						},
						reader: {
							type: 'json',
							root: 'data'
						}
					}),
					sorters:[{
						property: 'date_start',
						direction: 'DESC'
					}]
				},
				listeners: {
					selectionchange: function(selModel, selections){
						this.child('grid').down('#delete').setDisabled(selections.length === 0);
					},
					scope: this
				}
			}]
		});
		
		this.callParent() ;
		if( this.peopleRecord ) {
			this.setPeopleRecord( this.peopleRecord ) ;
		}
	},
	setPeopleRecord: function( peopleRecord ) {
		this.peopleCode = peopleRecord.getId() ;
		this.child('form').loadRecord(peopleRecord) ;
		this.child('grid').getStore().getProxy().setExtraParam('people_code',peopleRecord.getId()) ;
		this.child('grid').getStore().load() ;
	},
	openNewEvent: function() {
		var me = this,
			gridpanel = me.child('grid') ;
		
		var rhNewEventPanel = Ext.create('Optima5.Modules.Spec.DbsPeople.RhNewEventPanel',{
			optimaModule: me.optimaModule,
			width:800, // dummy initial size, for border layout to work
			height:600, // ...
			floating: true,
			renderTo: me.getEl(),
			tools: [{
				type: 'close',
				handler: function(e, t, p) {
					p.ownerCt.destroy();
				}
			}]
		});
		
		// Size + position
		rhNewEventPanel.setSize({
			width: gridpanel.getSize().width - 20,
			height: 250
		}) ;
		rhNewEventPanel.on('neweventsubmit',function(formPanel, objValues) {
			this.handleEventNew(objValues) ;
			formPanel.destroy() ;
		},me) ;
		rhNewEventPanel.on('destroy',function() {
			me.getEl().unmask() ;
			// me.fireEvent('qbookztemplatechange') ;
		},me,{single:true}) ;
		me.getEl().mask() ;
		
		rhNewEventPanel.show();
		rhNewEventPanel.getEl().alignTo(gridpanel.getEl(), 'c-t?',[0,50]);
		
	},
	
	
	handleEventNew: function( eventData ) {
		var ajaxParams = {
			_moduleId: 'spec_dbs_people',
			_action: 'RH_editPeopleEvent',
			_subaction: 'new',
			people_code: this.peopleCode,
			data: Ext.JSON.encode(eventData)
		};
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams,
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					Ext.MessageBox.alert('Problem','Event not created !') ;
					return ;
				}
				this.reloadEvents() ;
				this.fireEvent('change',this) ;
			},
			scope: this
		}) ;
	},
	handleEventDelete: function( eventData ) {
		var eventId = eventData.event_id ;
		if( Ext.isEmpty(eventId) || eventId == 0 ) {
			return ;
		}
		
		Ext.MessageBox.confirm('Delete','Delete selected event ?', function(buttonStr) {
			if( buttonStr!='yes' ) {
				return ;
			}
		
			var ajaxParams = {
				_moduleId: 'spec_dbs_people',
				_action: 'RH_editPeopleEvent',
				_subaction: 'delete',
				people_code: this.peopleCode,
				event_id: eventId
			};
			this.optimaModule.getConfiguredAjaxConnection().request({
				params: ajaxParams,
				success: function(response) {
					var ajaxResponse = Ext.decode(response.responseText) ;
					if( ajaxResponse.success == false ) {
						Ext.MessageBox.alert('Problem','Cannot delete event') ;
						return ;
					}
					this.reloadEvents() ;
					this.fireEvent('change',this) ;
				},
				scope: this
			}) ;
			
		},this) ;
	},
	reloadEvents: function() {
		this.child('grid').getStore().load() ;
	}
}) ;