Ext.define('DbsPeopleRhActivityModel', {
    extend: 'Ext.data.Model',
    fields: [
        {name: 'icon_cls',  type: 'string'},
        {name: 'lib',  type: 'string'},
        {name: 'date_start',   type: 'string'},
        {name: 'date_end',   type: 'string'}
     ]
});

Ext.define('Optima5.Modules.Spec.DbsPeople.RhFormPanel',{
	extend: 'Ext.panel.Panel',
	
	optimaModule: null,
	devRecord: null,
	
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
					xtype:'op5crmbasebibletreepicker',
					bibleId: 'RH_PEOPLE',
					fieldLabel: 'Contrat',
					value: 'CDI',
					selectMode: 'single',
					optimaModule: me.optimaModule
				},{
					xtype:'fieldset',
					title: 'Situation actuelle (instant T)',
					items:[{
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
					handler: function(){
						this.onBtnDelete() ;
					},
					scope: this
				}],
				columns:[{
					text: '',
					width: 20,
					sortable: false,
					dataIndex: 'icon_cls',
					menuDisabled: true,
					renderer: function( value, metadata, record )
					{
						metadata.tdCls = value
					}
				},{
					width: 160,
					text:'Evenement',
					dataIndex:'lib'
				},{
					text:'Start',
					dataIndex:'date_start'
				},{
					text:'Fin',
					dataIndex:'date_end'
				}],
				store: {
					model: 'DbsPeopleRhActivityModel',
					data:[
						{icon_cls:'op5-spec-dbspeople-icon-move',lib:'<b>MoveTo:</b> Batiment 2',date_start:'03/02/2014', date_end:'<b>permanent</b>'},
						{icon_cls:'op5-spec-dbspeople-icon-absence',lib:'Congés payés',date_start:'25/01/2014', date_end:'02/02/2014'}
					]
				}
			}]
		});
		
		this.callParent() ;
		this.child('form').loadRecord(me.devRecord) ;
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
		rhNewEventPanel.on('destroy',function() {
			me.getEl().unmask() ;
			// me.fireEvent('qbookztemplatechange') ;
		},me,{single:true}) ;
		me.getEl().mask() ;
		
		rhNewEventPanel.show();
		rhNewEventPanel.getEl().alignTo(gridpanel.getEl(), 'c-t?',[0,50]);
		
	}
	
}) ;