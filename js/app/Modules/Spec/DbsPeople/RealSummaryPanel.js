Ext.define('DbsPeopleRealSummaryModel',{
	extend: 'Ext.data.Model',
	fields:[
		{name:'checked', type:'boolean'},
		{name:'role_code', type:'string'},
		{
			name: 'role_txt',
			type: 'string',
			convert: function(v, record) {
				v = record.data.role_code ;
				v = Optima5.Modules.Spec.DbsPeople.HelperCache.forTypeGetById("ROLE",v).text ;
				v = v.substr( v.indexOf('-') + 1 ) ;
				return v ;
			}
		},
		{name:'role_sum_duration', type:'number'},
		{name:'role_sum_days', type:'number'}
	]
}) ;

Ext.define('Optima5.Modules.Spec.DbsPeople.RealSummaryPanel',{
	extend:'Ext.panel.Panel',
	
	editDisabled: null,

	initComponent: function() {
		var me = this ;
		var round2_renderer = function(v) {
			return ( Math.round(v*100) / 100 );
		} ;
		Ext.apply( me, {
			layout:{
				type:'vbox',
				align:'stretch'
			},
			frame: true,
			title: 'Compteurs ETP',
			items:[{
				xtype: 'panel',
				height: 84,
				bodyCls: 'ux-noframe-bg',
				border: false,
				layout: {
					type:'hbox',
					align:'stretch'
				},
				items: [{
					itemId: 'pHeader',
					xtype:'component',
					width: 64,
					cls: 'op5-spec-dbspeople-realsummary-box'
				},{
					xtype:'form',
					border: false,
					bodyPadding: '0px 5px',
					bodyCls: 'ux-noframe-bg',
					flex: 1,
					layout: 'anchor',
					fieldDefaults: {
						labelAlign: 'left',
						labelWidth: 60,
						anchor: '100%'
					},
					items:[{
						xtype:'datefield',
						startDay:1,
						format: 'Y-m-d',
						width: 180,
						anchor: '',
						value: new Date(),
						name : 'date_sql',
						fieldLabel: 'Date'
					},Ext.create('Optima5.Modules.Spec.DbsPeople.CfgParamSiteField',{
						optimaModule: this.optimaModule,
						submitValue: false,
						name : 'filter_site',
						fieldLabel: 'Site',
						listeners: {
							ready: {
								fn: function() {
									this.onPreInit() ;
								},
								scope: this
							}
						}
					}),Ext.create('Optima5.Modules.Spec.DbsPeople.CfgParamTeamField',{
						optimaModule: this.optimaModule,
						submitValue: false,
						name : 'filter_team',
						fieldLabel: 'Equipe',
						listeners: {
							ready: {
								fn: function() {
									this.onPreInit() ;
								},
								scope: this
							}
						},
						noAuthCheck: true
					})]
				}]
			},{
				xtype:'grid',
				height: 400,
				columns: {
					defaults:{
						menuDisabled: true,
						draggable: false,
						sortable: false,
						hideable: false,
						resizable: false,
						groupable: false,
						lockable: false
					},
					items:[{
						dataIndex: 'role_code',
						text: 'Code',
						width: 80
					},{
						dataIndex: 'role_txt',
						text: 'Role',
						flex: 1
					},{
						dataIndex: 'role_sum_duration',
						align: 'right',
						text: 'H/hom',
						width: 60,
						renderer: round2_renderer
					},{
						dataIndex: 'role_sum_days',
						align: 'right',
						text: 'J/hom',
						width: 60,
						renderer: round2_renderer
					}]
					
				},
				store: {
					model: 'DbsPeopleRealSummaryModel',
					data: [],
					sorters: [{
						property: 'role_code',
						direction: 'ASC'
					}]
				}
			}]
		});
		this.preInit = 2 ;
		this.callParent() ;
	},
	onPreInit: function() {
		var me = this ;
		me.preInit-- ;
		if( me.preInit == 0 ) {
			me.isReady=true ;
			me.startPanel() ;
		}
	},
	
	startPanel: function() {
		if( this.cfgData ) {
			var formData = {
				date_sql: this.cfgData.date_sql,
				filter_site: this.cfgData.filter_site,
				filter_team: this.cfgData.filter_team
			} ;
			this.down('form').getForm().setValues(formData) ;
			
			if( this.cfgData.peopledayRecordsData ) {
				this.processRecords( this.cfgData.peopledayRecordsData ) ;
			} else {
				this.fetchRecords() ;
			}
		} else {
			this.down('form').destroy() ;
			return ;
		}
		
		this.down('form').getForm().getFields().each(function(field) {
			field.on('change',function(){
				this.fetchRecords() ;
			},this) ;
		},this) ;
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
	},
	
	fetchRecords: function() {
		this.showLoadmask() ;
		
		// Filtres en cours
		var formBasic = this.down('form').getForm(),
			dSql = formBasic.findField('date_sql').getSubmitValue(),
			filterSiteBtn = formBasic.findField('filter_site'),
			filterTeamBtn = formBasic.findField('filter_team') ;
		
		var params = {
			_moduleId: 'spec_dbs_people',
			_action: 'Real_getData'
		};
		Ext.apply( params, {
			date_start: dSql,
			date_end: dSql
		}) ;
		if( filterSiteBtn.getNode() != null ) {
			params['filter_site_entries'] = Ext.JSON.encode( filterSiteBtn.getLeafNodesKey() ) ;
		}
		if( filterTeamBtn.getNode() != null ) {
			params['filter_team_entries'] = Ext.JSON.encode( filterTeamBtn.getLeafNodesKey() ) ;
		}
		
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: params,
			success: function(response) {
				var jsonResponse = Ext.JSON.decode(response.responseText) ;
				if( jsonResponse.success ) {
					this.processRecords(jsonResponse.data) ;
				}
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		});
	},
	processRecords: function(peopledayRecordsData) {
		var peopledayStore = Ext.create('Ext.data.Store',{
			model: 'DbsPeoplePeopledayModel',
			data: peopledayRecordsData,
			proxy:{
				type:'memory'
			},
			getById: function(id) { //HACK
				return this.idMap[id];
			},
			listeners:{
				load: function(store,records,successful) {
					store.idMap = {};
					Ext.Array.forEach(records, function(record) {
						store.idMap[record.getId()] = record;
					});
				}
			}
		}) ;
		
		// Filtres en cours
		var formBasic = this.down('form').getForm(),
			dSql = formBasic.findField('date_sql').getSubmitValue(),
			filterBtn_site = formBasic.findField('filter_site'),
			filterBtn_team = formBasic.findField('filter_team'),
			filter_whses = ( filterBtn_site.getNode()==null ? null : filterBtn_site.getLeafNodesKey() ),
			filter_teams = ( filterBtn_team.getNode()==null ? null : filterBtn_team.getLeafNodesKey() ) ;
		
		var objRoleDuration = {},
			objRoleDurationDays = {} ;
		var addDuration = function(roleCode,roleLength,roleLengthDays) {
			if( !objRoleDuration.hasOwnProperty(roleCode) ) {
				objRoleDuration[roleCode] = 0 ;
				objRoleDurationDays[roleCode] = 0 ;
			}
			objRoleDuration[roleCode] += roleLength ;
			objRoleDurationDays[roleCode] += roleLengthDays ;
		}
		
		peopledayStore.each( function(peopledayRecord) {
			if( peopledayRecord.get('date_sql') != dSql ) {
				return ;
			}
			if( peopledayRecord.get('status_isVirtual') ) {
				var stdDayLength = peopledayRecord.data.std_daylength,
					stdDayDay = (stdDayLength > 0 ? 1 : 0),
					stdAbsCode = peopledayRecord.data.std_abs_code,
					stdAbsHalfDay = false ;
				if( stdAbsCode.split(':')[1] == '2' ) {
					stdAbsHalfDay = true ;
					stdDayLength = stdDayLength / 2 ;
					stdDayDay = stdDayDay / 2 ;
				}
			
				if( stdAbsCode.charAt(0) != '_' && !stdAbsHalfDay ) {
					return ;
				}
				if( filter_whses && !Ext.Array.contains(filter_whses,peopledayRecord.data.std_whse_code) ) {
					return ;
				}
				if( filter_teams && !Ext.Array.contains(filter_teams,peopledayRecord.data.std_team_code) ) {
					return ;
				}
				addDuration(
					peopledayRecord.data.std_role_code,
					stdDayLength,
					stdDayDay
  				) ;
			}
			peopledayRecord.works().each( function(peopledayWorkRecord) {
				if( filter_whses ) {
					if( Ext.isEmpty(peopledayWorkRecord.data.alt_whse_code) ) {
						if( !Ext.Array.contains(filter_whses,peopledayRecord.data.std_whse_code) ) {
							return ;
						}
					} else {
						if( !Ext.Array.contains(filter_whses,peopledayWorkRecord.data.alt_whse_code) ) {
							return ;
						}
					}
				}
				if( filter_teams && !Ext.Array.contains(filter_teams,peopledayRecord.data.std_team_code) ) {
					return ;
				}
				addDuration(
					peopledayWorkRecord.data.role_code,
					peopledayWorkRecord.data.role_length,
					(peopledayWorkRecord.data.role_length / peopledayRecord.data.std_daylength_contract)
				) ;
			});
		}) ;
		
		var summaryRows = [] ;
		Ext.Object.each( objRoleDuration, function(roleCode, roleDuration) {
			summaryRows.push({
				role_code: roleCode,
				role_sum_duration: roleDuration,
				role_sum_days: objRoleDurationDays[roleCode]
			});
		}) ;
		
		this.down('grid').getStore().loadData(summaryRows) ;
	}
}) ;