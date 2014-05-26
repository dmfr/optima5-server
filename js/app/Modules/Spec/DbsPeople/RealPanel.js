Ext.define('DbsPeoplePeopledayWorkModel',{
	extend: 'Ext.data.Model',
	fields: [
		{name: 'role_code', type:'string'},
		{name: 'role_length', type:'number'},
		{name: 'alt_whse_code', type:'string'}
	]
}) ;
Ext.define('DbsPeoplePeopledayAbsModel',{
	extend: 'Ext.data.Model',
	fields: [
		{name: 'abs_code', type:'string'},
		{name: 'abs_length', type:'number'}
	]
}) ;
Ext.define('DbsPeoplePeopledayModel', {
	extend: 'Ext.data.Model',
	fields: [
		{name: 'status_isVirtual',  type: 'boolean'},
		{name: 'status_isValidCeq',  type: 'boolean'},
		{name: 'status_isValidRh',  type: 'boolean'},
		{name: 'date_sql',  type: 'string'},
		{name: 'people_code',  type: 'string'},
		{name: 'people_name',   type: 'string'},
		{name: 'people_techid',   type: 'string'},
		{name: 'std_team_code',   type: 'string'},
		{name: 'std_whse_code',   type: 'string'},
		{name: 'std_role_code',   type: 'string'},
		{name: 'std_abs_code',   type: 'string'},
		{name: 'std_contract_code',   type: 'string'},
		{name: 'std_daylength',   type: 'number'},
		{name: 'std_daylength_max',   type: 'number'},
		{name: 'real_is_abs',   type: 'boolean'}
	],
	hasMany: [{
		model: 'DbsPeoplePeopledayWorkModel',
		name: 'works',
		associationKey: 'works'
	},{
		model: 'DbsPeoplePeopledayAbsModel',
		name: 'abs',
		associationKey: 'abs'
	}]
}) ;


Ext.define('DbsPeopleRealRowModel', {
	extend: 'Ext.data.Model',
	fields: [
		{name: 'whse_code',  type: 'string'},
		{name: 'whse_isAlt', type:'boolean'},
		{
			name: 'whse_txt',
			type: 'string',
			convert: function(v, record) {
				v = record.data.whse_code ;
				return Optima5.Modules.Spec.DbsPeople.HelperCache.forTypeGetById("WHSE",v).text ;
			}
		},
		{name: 'team_code',  type: 'string'},
		{
			name: 'team_txt',
			type: 'string',
			convert: function(v, record) {
				v = record.data.team_code ;
				return Optima5.Modules.Spec.DbsPeople.HelperCache.forTypeGetById("TEAM",v).text ;
			}
		},
		{name: 'contract_code',  type: 'string'},
		{
			name: 'contract_txt',
			type: 'string',
			convert: function(v, record) {
				v = record.data.contract_code ;
				return Optima5.Modules.Spec.DbsPeople.HelperCache.forTypeGetById("CONTRACT",v).text ;
			}
		},
		{name: 'std_role_code',  type: 'string'},
		{
			name: 'std_role_txt',
			type: 'string',
			convert: function(v, record) {
				v = record.data.std_role_code ;
				return Optima5.Modules.Spec.DbsPeople.HelperCache.forTypeGetById("ROLE",v).text ;
			}
		},
		{name: 'people_code',   type: 'string'},
		{name: 'people_name',   type: 'string'},
		{name: 'people_techid',   type: 'string'},
		{name: 'dummy',   type: 'string'}
	]
});


Ext.define('Optima5.Modules.Spec.DbsPeople.RealPanel',{
	extend:'Ext.panel.Panel',
	
	requires:[
		'Optima5.Modules.Spec.DbsPeople.RealAdvancedPanel',
		'Optima5.Modules.Spec.DbsPeople.RealVirtualPanel',
		'Optima5.Modules.Spec.DbsPeople.CfgParamSiteButton',
		'Optima5.Modules.Spec.DbsPeople.CfgParamTeamButton',
		'Optima5.Modules.Spec.DbsPeople.RealConfirmPanel'
	],
	
	dateStart: null,
	dateEnd: null,
	
	peopledayStore: null,
	
	autoRefreshDelay: (5*60*1000),
	autoRefreshTask: null,
	autoRefreshAfterEdit: false,
	
	initComponent: function() {
		var me = this ;
		
		Ext.apply(me,{
			//frame: true,
			border: false,
			layout:'fit',
			tbar:[{
				icon: 'images/op5img/ico_back_16.gif',
				text: '<u>Retour menu</u>',
				handler: function(){
					this.handleQuit() ;
				},
				scope: this
			},{
				xtype: 'tbseparator'
			},Ext.create('Optima5.Modules.Spec.DbsPeople.CfgParamSiteButton',{
				itemId: 'btnSite',
				optimaModule: this.optimaModule,
				listeners: {
					change: {
						fn: function() {
							this.doLoad(true) ;
						},
						scope: this
					},
					ready: {
						fn: function() {
							this.onPreInit() ;
						},
						scope: this
					}
				}
			}),Ext.create('Optima5.Modules.Spec.DbsPeople.CfgParamTeamButton',{
				itemId: 'btnTeam',
				optimaModule: this.optimaModule,
				listeners: {
					change: {
						fn: function() {
							this.doLoad(true) ;
						},
						scope: this
					},
					ready: {
						fn: function() {
							this.onPreInit() ;
						},
						scope: this
					}
				}
			}),'->',{
				iconCls: 'op5-crmbase-datatoolbar-refresh',
				text: 'Refresh',
				handler: function() {
					this.doLoad() ;
				},
				scope: this
			},{
				icon: 'images/op5img/ico_calendar_16.png',
				text: 'Choix Semaine',
				menu: Ext.create('Ext.menu.DatePicker',{
					startDay: 1,
					listeners:{
						select: function( datepicker, date ) {
							this.onDateSet(date) ;
							Ext.menu.Manager.hideAll() ;
						},
						scope: this
					}
				})
			},{
				icon: 'images/op5img/ico_info_small.gif',
				text: 'Légende',
				menuAlign: 'tr-br?',
				menu: {
					xtype:'menu',
					items:[{
						xtype:'dataview',
						cls: 'op5-spec-dbspeople-realcolorinfo',
						tpl: new Ext.XTemplate(
							'<tpl for=".">',
								'<div class="op5-spec-dbspeople-realcolorinfo-item">',
									'{text}',
									'<div class="op5-spec-dbspeople-realcolorinfo-item-icon {iconCls}"></div>',
								'</div>',
							'</tpl>'
						),
						itemSelector: 'div.op5-spec-dbspeople-realcolorinfo-item',
						store: {
							fields: ['iconCls', 'text'],
							data:[
								{iconCls: 'op5-spec-dbspeople-realcolor-open', text:'Etat : Ouvert Chef Equipe'},
								{iconCls: 'op5-spec-dbspeople-realcolor-openrh', text:'Etat : Ouvert RH'},
								{iconCls: '', text:'Etat : clôture'},
								{iconCls: 'op5-spec-dbspeople-realcolor-role', text:'Modif. Rôle'},
								{iconCls: 'op5-spec-dbspeople-realcolor-anomalie', text:'Absence'},
								{iconCls: 'op5-spec-dbspeople-realcolor-whse', text:'Transfert'}
							]
						},
						//frame: true,
						width:200,
						height:200
					}]
				}
			}],
			items:[{
				border: false,
				xtype:'component',
				cls: 'op5-waiting'
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
		var me = this ;
		
		this.autoRefreshTask = new Ext.util.DelayedTask( function(){
			if( this.isDestroyed ) { // private check
				return ;
			}
			var executed = this.doLoadIf() ;
			if( !executed ) {
				this.autoRefreshAfterEdit = true ;
			}
		},this);
		
		me.onDateSet( new Date() ) ;
		return ;
	},
	
	helperGetRoleTxt: function( roleCode ) {
		return Optima5.Modules.Spec.DbsPeople.HelperCache.forTypeGetById("ROLE",roleCode).text ;
	},
	helperGetWhseTxt: function( whseCode ) {
		return Optima5.Modules.Spec.DbsPeople.HelperCache.forTypeGetById("WHSE",whseCode).text ;
	},
	helperGetTeamTxt: function( teamCode ) {
		return Optima5.Modules.Spec.DbsPeople.HelperCache.forTypeGetById("TEAM",teamCode).text ;
	},
	helperGetAbsTxt: function( absCode ) {
		return Optima5.Modules.Spec.DbsPeople.HelperCache.forTypeGetById("ABS",absCode).text ;
	},
	
	onDateSet: function( date ) {
		var me = this ;
		
		// configuration GRID
		var first = date.getDate() - ( date.getDay() > 0 ? date.getDay() : 7 ) + 1; // First day is the day of the month - the day of the week
		var last = first + 6; // last day is the first day + 6
		
		me.dateStart = new Date(Ext.clone(date).setDate(first));
		me.dateEnd = new Date(Ext.clone(date).setDate(last));
		
		me.doGridConfigure() ;
		me.doLoad(true) ;
	},
	doGridConfigure: function() {
		var me = this,
			modelName = 'RealPanel-Grid-' + me.getId(),
			dateStart = Ext.clone(me.dateStart),
			dateEnd = Ext.clone(me.dateEnd) ;
			
		if( Ext.ModelManager.getModel(modelName) != null ) {
			Ext.ModelManager.unregister(Ext.ModelManager.getModel(modelName)) ;
		}
		
		var getStatusTdCls = function( peopledayRecord ) {
			if( peopledayRecord.data.status_isVirtual == true ) {
				return 'op5-spec-dbspeople-realcell-virtual' ;
			}
			if( !peopledayRecord.data.status_isValidCeq && !peopledayRecord.data.status_isValidRh ) {
				return 'op5-spec-dbspeople-realcolor-open' ;
			}
			if( !peopledayRecord.data.status_isValidRh ) {
				return 'op5-spec-dbspeople-realcolor-openrh' ;
			}
			return '' ;
		} ;
		
		var roleRenderer = function(value, metaData, record, rowIndex, colIndex) {
			var rowWhseCode = record.get('whse_code'),
				rowIsAltWhse = record.get('whse_isAlt'),
				rowTeamCode = record.get('team_code') ;
				
			var dateSql = this.headerCt.getHeaderAtIndex(colIndex).dateSql,
				peopleCode = record.data.people_code,
				peopledayId = peopleCode+'@'+dateSql,
				peopledayRecord = me.peopledayStore.getById(peopledayId) ;
			if( peopledayRecord == null ) {
				return '' ;
			}
			if( !rowIsAltWhse && peopledayRecord.data.std_whse_code != rowWhseCode ) {
				return '' ;
			}
			if( peopledayRecord.data.std_team_code != rowTeamCode ) {
				return '' ;
			}
			
			metaData.tdCls += ' ' + getStatusTdCls(peopledayRecord) ;
			
			if( peopledayRecord.data.status_isVirtual == true ) {
				if( rowIsAltWhse ) {
					return '' ;
				}
				if( peopledayRecord.data.std_daylength == 0 ) {
					return '' ;
				}
				if( !Ext.isEmpty(peopledayRecord.data.std_abs_code) && peopledayRecord.data.std_abs_code.charAt(0) != '_' ) {
					metaData.tdCls += ' op5-spec-dbspeople-realcell-absplanning' ;
					return peopledayRecord.data.std_abs_code ;
				}
				return peopledayRecord.data.std_role_code ;
			}
			
			var worksStore = peopledayRecord.works(),
				absStore = peopledayRecord.abs() ;
			if( worksStore.getCount() == 0 && absStore.getCount() == 0 ) {
				if( peopledayRecord.data.std_daylength > 0 ) {
					metaData.tdCls += ' op5-spec-dbspeople-realcolor-anomalie' ;
				}
				return '' ;
			}
			
			var rolesArr = [],
				rolesHasAltWhse = false ;
			worksStore.each( function(workRecord) {
				if( rowIsAltWhse && workRecord.data.alt_whse_code != rowWhseCode ) {
					return ;
				}
				if( workRecord.data.alt_whse_code && !rowIsAltWhse ) {
					if( !rolesHasAltWhse ) {
						rolesHasAltWhse = true ;
						rolesArr.push('@') ;
						metaData.tdCls += ' op5-spec-dbspeople-realcolor-whse' ;
					}
					return ;
				}
				if( workRecord.data.role_code != peopledayRecord.data.std_role_code ) {
					rolesArr.push( '<span class="op5-spec-dbspeople-realcell-diff">' + workRecord.data.role_code + '</span>' ) ;
					return ;
				}
				rolesArr.push( workRecord.data.role_code ) ;
			}) ;
			var stdAbsCode = peopledayRecord.data.std_abs_code ;
			absStore.each( function(absRecord) {
				if( rowIsAltWhse ) {
					return ;
				}
				var cls = (absRecord.data.abs_code == stdAbsCode ? 'op5-spec-dbspeople-realcell-absplanning' : 'op5-spec-dbspeople-realcell-absent') ;
				rolesArr.push( '<span class="'+cls+'">' + absRecord.data.abs_code + '</span>' ) ;
			}) ;
			
			return rolesArr.join('+') ;
		};
		
		var lengthRenderer = function(value, metaData, record, rowIndex, colIndex) {
			var rowWhseCode = record.get('whse_code'),
				rowIsAltWhse = record.get('whse_isAlt'),
				rowTeamCode = record.get('team_code') ;
				
			var dateSql = this.headerCt.getHeaderAtIndex(colIndex).dateSql,
				peopleCode = record.data.people_code,
				peopledayId = peopleCode+'@'+dateSql,
				peopledayRecord = me.peopledayStore.getById(peopledayId) ;
			if( peopledayRecord == null ) {
				return '' ;
			}
			if( !rowIsAltWhse && peopledayRecord.data.std_whse_code != rowWhseCode ) {
				return '' ;
			}
			if( peopledayRecord.data.std_team_code != rowTeamCode ) {
				return '' ;
			}
			
			metaData.tdCls += ' ' + getStatusTdCls(peopledayRecord) ;
			
			if( peopledayRecord.data.status_isVirtual == true ) {
				if( rowIsAltWhse ) {
					return '' ;
				}
				if( peopledayRecord.data.std_daylength == 0 ) {
					return '' ;
				}
				if( !Ext.isEmpty(peopledayRecord.data.std_abs_code) && peopledayRecord.data.std_abs_code.charAt(0) != '_' ) {
					return '' ;
				}
				return peopledayRecord.data.std_daylength ;
			}
			
			
			var hasAltWhse = false ;
			
			var workLength = 0,
				altWhseLength = 0 ;
			peopledayRecord.works().each( function(workRecord) {
				if( rowIsAltWhse && workRecord.data.alt_whse_code != rowWhseCode ) {
					return ;
				}
				if( workRecord.data.alt_whse_code && !rowIsAltWhse ) {
					hasAltWhse = true ;
					altWhseLength += workRecord.data.role_length ;
					return ;
				}
				workLength += workRecord.data.role_length ;
			}) ;
			
			var absLength = 0 ;
			peopledayRecord.abs().each( function(absRecord) {
				absLength += absRecord.data.abs_length ;
			}) ;
			
			
			if( !rowIsAltWhse && (workLength+altWhseLength) != peopledayRecord.data.std_daylength ) {
				if( (workLength + absLength + altWhseLength) < peopledayRecord.data.std_daylength ) {
					metaData.tdCls += ' op5-spec-dbspeople-realcolor-anomalie' ;
				} else if( (workLength + altWhseLength) < peopledayRecord.data.std_daylength ) {
					metaData.tdCls += ' op5-spec-dbspeople-balance-neg' ;
				} else {
					metaData.tdCls += ' op5-spec-dbspeople-balance-pos' ;
				}
			} else if( hasAltWhse ) {
				metaData.tdCls += ' op5-spec-dbspeople-realcolor-whse' ;
			}
			
			if( workLength==0 && peopledayRecord.data.std_daylength == 0 ) {
				return '' ;
			}
			if( workLength==0 && (!Ext.isEmpty(peopledayRecord.data.std_abs_code) && peopledayRecord.data.std_abs_code.charAt(0) != '_') ) {
				return '' ;
			}
			if( workLength==0 && rowIsAltWhse ) {
				return '' ;
			}
			return workLength ;
		};
		
		var pushModelfields = [] ;
		var columns = [{
			locked: true,
			text: 'Entrepôt',
			dataIndex: 'whse_txt',
			width: 180,
			_groupBy: 'whse_code'
		},{
			locked: true,
			text: 'Equipe',
			dataIndex: 'team_txt',
			width: 100,
			_groupBy: 'team_code'
		},{
			locked: true,
			text: 'Contrat',
			dataIndex: 'contract_txt',
			width: 80,
			_groupBy: 'contract_code'
		},{
			locked: true,
			text: 'FuncStd',
			dataIndex: 'std_role_code',
			width: 60,
			_groupBy: 'std_role_code'
		},{
			locked: true,
			text: '<b>Nom complet</b>',
			dataIndex: 'people_name',
			width: 200,
			renderer: function(v) {
				return '<b>'+v+'</b>' ;
			}
		}] ;
		for( var d = dateStart ; d <= dateEnd ; d.setDate( d.getDate() + 1 ) ) {
			var dStr = Ext.Date.format(d,'Ymd'),
				dSql = Ext.Date.format(d,'Y-m-d');
			
			pushModelfields.push({
				name:'d_'+dStr,
				type:'string'
			}) ;
			pushModelfields.push({
				name:'d_'+dStr+'_role',
				type:'string'
			}) ;
			pushModelfields.push({
				name:'d_'+dStr+'_tmp',
				type:'string'
			}) ;
			
			columns.push({
				text: Optima5.Modules.Spec.DbsPeople.HelperCache.DayNamesIntl.FR[d.getDay()] + ' ' + Ext.Date.format(d,'d/m'),
				dateSqlHead: dSql,
				columns: [{
					text: 'Role',
					menuDisabled: true,
					//dataIndex: 'd_'+dStr+'_role',
					dateHash: 'd_'+dStr,
					dateSql: dSql,
					width: 60,
					align: 'center',
					editor: {
						ROLE: true,
						xtype: 'combobox',
						queryMode: 'local',
						allowBlank:false,
						forceSelection: true,
						editable: true,
						typeAhead: true,
						selectOnFocus: true,
						displayField: 'text',
						displayTpl: [
							'<tpl for=".">',
								'{[typeof values === "string" ? values : values["id"]]}',
								'<tpl if="xindex < xcount">' + ',' + '</tpl>',
							'</tpl>'
						],
						valueField: 'id',
						store: {
							fields: ['id','text'],
							data : []
						},
						matchFieldWidth: false
					},
					renderer: roleRenderer
				},{
					text: 'Tmp',
					menuDisabled: true,
					//dataIndex: 'd_'+dStr+'_tmp',
					dateHash: 'd_'+dStr,
					dateSql: dSql,
					width:50,
					editor: {xtype: 'numberfield', minValue: 0 },
					renderer: lengthRenderer
				}]
			}) ;
		}
		
		var columnDefaults = {
			menuDisabled: false,
			draggable: false,
			sortable: false,
			hideable: false,
			resizable: false,
			groupable: false,
			lockable: false
		} ;
		Ext.Array.each( columns, function(column) {
			Ext.applyIf( column, columnDefaults ) ;
			if( !Ext.isEmpty(column['_groupBy']) ) {
				// false groupable to enable columnMenu
				column['groupable'] = true ;
			}
		}) ;
		
		
		me.removeAll() ;
		me.add({
			border: false,
			xtype:'grid',
			store: {
				model: 'DbsPeopleRealRowModel',
				data: [],
				proxy:{
					type:'memory'
				},
				listeners: {
					groupchange: me.onGridGroupChange,
					scope: this
				}
			},
			enableLocking: true,
			plugins: [{
				ptype: 'cellediting',
				pluginId: 'cellediting',
				clicksToEdit: 1,
				listeners: {
					beforeedit: me.onGridBeforeEdit,
					edit: me.onGridAfterEdit,
					scope: me
				},
				lockableScope: 'normal'
			},{
				ptype: 'bufferedrenderer',
				lockableScope: 'both',
				synchronousRender: true
			}],
			features: [{
				//groupHeaderTpl: '{name}',
				ftype: 'grouping',
				hideGroupedHeader: false,
				enableGroupingMenu: false,
				enableNoGroups: false,
				groupHeaderTpl:Ext.create('Ext.XTemplate',
					'<div>{[this.renderer(values)]}</div>',
					{
						renderer: function(values) {
							if( values.rows.length == 0 ) {
								return '' ;
							}
							switch( values.groupField ) {
								case 'whse_code' :
									return values.rows[0].data.whse_txt ;
								case 'team_code' :
									return values.rows[0].data.team_txt ;
								case 'contract_code' :
									return values.rows[0].data.contract_txt ;
								case 'std_role_code' :
									return values.rows[0].data.std_role_txt ;
								default :
									return '' ;
							}
						}
					}
				)
			}],
			columns: columns,
			listeners: {
				afterlayout: function( gridpanel ) {
					gridpanel.headerCt.on('menucreate',me.onColumnsMenuCreate,me) ;
				},
				itemcontextmenu: function( gridview, record, node, index, e ) {
					var cellNode = e.getTarget(gridview.cellSelector);
					
					var gridRecord = record,
						column = gridview.getHeaderByCell(cellNode),
						dateSql = column.dateSql,
						peopleCode = gridRecord.data.people_code,
						peopledayId = peopleCode+'@'+dateSql,
						peopledayRecord = this.peopledayStore.getById(peopledayId) ;
					if( peopledayRecord == null ) {
						return ;
					}
					if( peopledayRecord.data.status_isVirtual == true ) {
						me.openVirtual( peopledayRecord, gridRecord, cellNode ) ;
						return ;
					}
					if( !me.hasPermissionToEdit( peopledayRecord ) ) {
						return ;
					}
					me.openAdvanced( peopledayRecord, gridRecord, cellNode ) ;
				},
				scope: me
			},
			viewConfig: {
				preserveScrollOnRefresh: true,
				getRowClass: function(record) {
					if( record.get('whse_isAlt') ) {
						return 'op5-spec-dbspeople-realcolor-whse' ;
					}
				}
			}
		}) ;
	},
	
	onColumnsMenuCreate: function( headerCt, menu ) {
		var me = this;
		if( true ) {
			menu.add({
				itemId: 'grid-groupby',
				icon: 'images/op5img/ico_groupby_16.png',
				text: 'Group By',
				handler: function(menuitem) {
					this.onColumnGroupBy( menuitem.up('menu').activeHeader._groupBy ) ;
				},
				scope: this
			});
			menu.add({
				itemId: 'real-open',
				iconCls: 'op5-spec-dbspeople-icon-actionday-open',
				text: 'Ouverture Jour',
				handler: function(menuitem) {
					this.handleActionDay( 'open', menuitem.up('menu').activeHeader.dateSqlHead ) ;
				},
				scope: this
			});
			menu.add({
				itemId: 'real-valid-ceq',
				iconCls: 'op5-spec-dbspeople-icon-actionday-validceq' ,
				text: 'Valid Chef d\'équipe',
				handler: function(menuitem) {
					this.handleActionDay( 'valid_ceq', menuitem.up('menu').activeHeader.dateSqlHead ) ;
				},
				scope: this
			});
			menu.add({
				itemId: 'real-valid-rh',
				iconCls: 'op5-spec-dbspeople-icon-actionday-validrh' ,
				text: 'Valid RH',
				handler: function(menuitem) {
					this.handleActionDay( 'valid_rh', menuitem.up('menu').activeHeader.dateSqlHead ) ;
				},
				scope: this
			});
			menu.add({
				itemId: 'real-reopen',
				iconCls: 'op5-spec-dbspeople-icon-actionday-reopen' ,
				text: 'Réouverture',
				handler: function(menuitem) {
					this.handleActionDay( 'reopen', menuitem.up('menu').activeHeader.dateSqlHead ) ;
				},
				scope: this
			});
			menu.add({
				itemId: 'real-delete',
				iconCls: 'op5-spec-dbspeople-icon-actionday-delete' ,
				text: 'Supprimer',
				handler: function(menuitem) {
					this.handleActionDay( 'delete', menuitem.up('menu').activeHeader.dateSqlHead ) ;
				},
				scope: this
			});
			menu.add({
				xtype: 'menucheckitem',
				itemId: 'real-checkbox-exceptionday',
				checked: false ,
				text: 'Exception jour',
				handler: Ext.emptyFn,
				listeners: {
					checkchange: function( menuitem, checked ) {
						this.handleExceptionDay( menuitem.up('menu').activeHeader.dateSqlHead, checked ) ;
					},
					scope: this
				}
			});
		}
		menu.on('beforeshow', me.onColumnsMenuBeforeShow, me);
	},
	onColumnsMenuBeforeShow: function( menu ) {
		var me = this,
			HelperCache = Optima5.Modules.Spec.DbsPeople.HelperCache,
			colCfg = menu.activeHeader.colCfg;
		menu.down('#grid-groupby').setVisible( !Ext.isEmpty(menu.activeHeader._groupBy) ) ;
		menu.down('menuseparator').setVisible( colCfg ) ;
		menu.down('#real-open').setVisible( colCfg && colCfg.enable_open && HelperCache.authHelperQueryPage('CEQ') ) ;
		menu.down('#real-valid-ceq').setVisible( colCfg && colCfg.enable_valid_ceq && HelperCache.authHelperQueryPage('CEQ') ) ;
		menu.down('#real-valid-rh').setVisible( colCfg && colCfg.enable_valid_rh && HelperCache.authHelperQueryPage('RH') ) ;
		menu.down('#real-reopen').setVisible( colCfg && !colCfg.enable_open && !colCfg.enable_valid_ceq && !colCfg.enable_valid_rh && HelperCache.authHelperQueryPage('ADMIN') ) ;
		menu.down('#real-delete').setVisible( colCfg && HelperCache.authHelperQueryPage('ADMIN') ) ;
		menu.down('#real-checkbox-exceptionday').setVisible( colCfg && colCfg.status_virtual && HelperCache.authHelperQueryPage('RH') ) ;
		menu.down('#real-checkbox-exceptionday').setChecked( colCfg && colCfg.status_exceptionDay, true ) ;
	},
	onColumnGroupBy: function( groupField ) {
		var grid = this.child('grid'),
			store = grid.getStore() ;
		store.group( groupField, 'ASC' ) ;
	},
	onGridGroupChange: function( gridStore, groupers ) {
		var grid = this.child('grid'),
			 groupFields = [] ;
		groupers.each( function(grouper) {
			groupFields.push(grouper.property) ;
		}) ;
		Ext.Array.each( grid.headerCt.query('[_groupBy]'), function(col) {
			if( col._alwaysHidden ) {
				col.hide() ;
			} else if( Ext.Array.contains(groupFields , col._groupBy) ) {
				col.hide() ;
			} else {
				col.show() ;
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
	
	doLoadIf: function() {
		var grid = this.child('grid'),
			normalGrid = grid.normalGrid, // lockedGrid private property
			cellediting = normalGrid.getPlugin('cellediting') ;
		if( cellediting.editing || this.realAdvancedPanel != null ) {
			// some editing currently
			return false ;
		}
		this.doLoad() ;
		return true ;
	},
	doLoad: function(filterChanged) {
		if( !this.isReady ) {
			return ;
		}
		this.autoRefreshTask.cancel() ;
		this.showLoadmask() ;
		
		var filterSiteBtn = this.down('#btnSite'),
			filterTeamBtn = this.down('#btnTeam') ;
		
		var params = {
			_moduleId: 'spec_dbs_people',
			_action: 'Real_getData'
		};
		Ext.apply( params, {
			date_start: Ext.Date.format( this.dateStart, 'Y-m-d' ),
			date_end: Ext.Date.format( this.dateEnd, 'Y-m-d' )
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
				this.onLoadResponse(response, filterChanged) ;
			},
			scope: this
		});
	},
	onLoadResponse: function(response, filterChanged) {
		var me = this ;
			
		var jsonResponse = Ext.JSON.decode(response.responseText) ;
		
		var grid = me.child('grid') ;
		Ext.Object.each( jsonResponse.columns, function( dSql, colCfg ) {
			var column = grid.headerCt.down('[dateSqlHead="'+dSql+'"]') ;
			column.colCfg = colCfg ;
			Ext.Array.each( column.query('gridcolumn'), function(subCol) {
				subCol.tdCls = '' ;
				subCol.tdCls += ( colCfg.status_exceptionDay ? ' '+'op5-spec-dbspeople-realcolor-exceptionday' : '') ;
			}) ;
		},this) ;
			
		this.peopledayStore = Ext.create('Ext.data.Store',{
			model: 'DbsPeoplePeopledayModel',
			data: jsonResponse.data,
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
		
		var grid = me.child('grid'),
			store = grid.getStore(),
			filter_site = me.down('#btnSite').getNode(),
			filter_team = me.down('#btnTeam').getNode() ;
		// inject inline data
		store.loadRawData( jsonResponse.rows ) ;
		store.sort('people_name','ASC') ;
		
		// cfg columns + groups
		grid.headerCt.down('[dataIndex="whse_txt"]')._alwaysHidden = (filter_site && filter_site.leaf_only) ;
		grid.headerCt.down('[dataIndex="team_txt"]')._alwaysHidden = (filter_team && filter_team.leaf_only) ;
		
		if( filterChanged ) {
			if( filter_site==null || !filter_site.leaf_only ) {
				store.group( 'whse_code', 'ASC' ) ;
			} else if( filter_team==null || !filter_team.leaf_only ) {
				store.group( 'team_code', 'ASC' ) ;
			} else {
				store.clearGrouping() ;
			}
		}
		
		// Drop loadmask
		this.hideLoadmask();
		
		// Setup autoRefresh task
		this.autoRefreshTask.delay( this.autoRefreshDelay ) ;
	},
	
	
	onGridBeforeEdit: function( editor, editEvent ) {
		var gridRecord = editEvent.record,
			column = editEvent.column,
			colIdx = editEvent.colIdx,
			dateSql = column.dateSql,
			peopleCode = gridRecord.data.people_code,
			peopledayId = peopleCode+'@'+dateSql,
			peopledayRecord = this.peopledayStore.getById(peopledayId),
			peopledayWorkRecords = peopledayRecord.works().getRange(),
			peopledayAbsRecords = peopledayRecord.abs().getRange() ;
		
			
		if( peopledayRecord.data.status_isVirtual == true ) {
			return false ;
		}
		
		if( !this.hasPermissionToEdit( peopledayRecord ) ) {
			return false ;
		}
		
		if( !(peopledayWorkRecords.length==1 && peopledayAbsRecords.length==0) || !Ext.isEmpty(peopledayWorkRecords[0].data.alt_whse_code) ) {
			var cellNode = Ext.DomQuery.select( '.x-grid-cell', editEvent.row )[colIdx] ;
			this.openAdvanced( peopledayRecord, gridRecord, cellNode ) ;
			return false ;
		}
		
		var peopledayWorkData = peopledayWorkRecords[0].data ;
		
		var editorField = editEvent.column.getEditor() ;
		switch( editorField.getXType() ) {
			case 'combobox' :
				editorField.getStore().loadData( Optima5.Modules.Spec.DbsPeople.HelperCache.forTypeGetAll("ROLE") ) ;
				editorField.setValue( peopledayWorkData.role_code ) ;
				editorField.on('select',function() {
					editor.completeEdit() ;
				},this,{single:true});
				break ;
			case 'numberfield' :
				editorField.setMaxValue( peopledayRecord.data.std_daylength_max ) ;
				editorField.setValue( peopledayWorkData.role_length ) ;
				break ;
				
			default :
				return false ;
		}
	},
	onGridAfterEdit: function( editor, editEvent ) {
		var gridRecord = editEvent.record,
			column = editEvent.column,
			colIdx = editEvent.colIdx,
			dateSql = column.dateSql,
			peopleCode = gridRecord.data.people_code,
			peopledayId = peopleCode+'@'+dateSql,
			peopledayRecord = this.peopledayStore.getById(peopledayId),
			peopledayWorkRecords = peopledayRecord.works().getRange() ;
		if( peopledayRecord.data.status_isVirtual == true ) {
			return false ;
		}
		if( peopledayWorkRecords.length != 1 || !Ext.isEmpty(peopledayWorkRecords[0].data.alt_whse_code) ) {
			return false ;
		}
		
		var peopledayWorkRecord = peopledayWorkRecords[0] ;
		var editorField = editEvent.column.getEditor() ;
		switch( editorField.getXType() ) {
			case 'combobox' :
				peopledayWorkRecord.set('role_code',editorField.getValue()) ;
				break ;
			case 'numberfield' :
				peopledayWorkRecord.set('role_length',editorField.getValue()) ;
				break ;
				
			default :
				return false ;
		}
		
		gridRecord.set( 'dummy', null );
		gridRecord.commit() ;
		this.remoteSavePeopledayRecord( peopledayRecord ) ;
	},
	
	hasPermissionToEdit: function( peopledayRecord ) {
		var HelperCache = Optima5.Modules.Spec.DbsPeople.HelperCache ;
		if( peopledayRecord.get('status_isValidRh') ) {
			if( HelperCache.authHelperQueryPage('ADMIN') ) {
				return true ;
			}
		} else if( peopledayRecord.get('status_isValidCeq') ) {
			if( HelperCache.authHelperQueryPage('RH') ) {
				return true ;
			}
		} else {
			if( HelperCache.authHelperQueryPage('CEQ') ) {
				return true ;
			}
		}
		return false ;
	},
	
	openAdvanced: function( peopledayRecord, gridRecord, htmlNode ) {
		this.openPopup( 'Optima5.Modules.Spec.DbsPeople.RealAdvancedPanel', peopledayRecord, gridRecord, htmlNode ) ;
	},
	openVirtual: function( peopledayRecord, gridRecord, htmlNode ) {
		this.openPopup( 'Optima5.Modules.Spec.DbsPeople.RealVirtualPanel', peopledayRecord, gridRecord, htmlNode ) ;
	},
	openPopup: function( className, peopledayRecord, gridRecord, htmlNode ) {
		var me = this ;
		me.openVirtualAfterPopup = false ;
		
		var realAdvancedPanel = Ext.create(className,{
			parentRealPanel: me,
			gridRecord: gridRecord,
			peopledayRecord: peopledayRecord,
			width:800, // dummy initial size, for border layout to work
			height:600, // ...
			floating: true,
			renderTo: me.up('viewport').getEl(),
			tools: [{
				type: 'close',
				handler: function(e, t, p) {
					var checkResult = p.ownerCt.doCheckBeforeSave() ;
					if( !Ext.isEmpty(checkResult) ) {
						Ext.MessageBox.alert('Erreur',checkResult) ;
						return ;
					}
					
					p.ownerCt.doSave() ;
					
					p.ownerCt.gridRecord.set( 'dummy', null );
					p.ownerCt.gridRecord.commit() ;
					p.ownerCt.destroy();
				},
				scope: this
			}]
		});
		
		// Size + position
		realAdvancedPanel.setSize({
			width: 300,
			height: 300
		}) ;
		realAdvancedPanel.on('destroy',function(realAdvancedPanel) {
			this.remoteSavePeopledayRecord( realAdvancedPanel.peopledayRecord ) ;
			me.getEl().unmask() ;
			me.realAdvancedPanel = null ;
			
			if( me.openVirtualAfterPopup ) {
				me.openVirtual( realAdvancedPanel.peopledayRecord, realAdvancedPanel.gridRecord, realAdvancedPanel.elXY ) ;
			}
		},me,{single:true}) ;
		me.getEl().mask() ;
		
		realAdvancedPanel.show();
		if( Ext.isArray(htmlNode) ) {
			realAdvancedPanel.getEl().setXY(htmlNode) ;
		} else {
			realAdvancedPanel.getEl().alignTo(htmlNode, 'c-t?',[0,60]);
		}
		me.realAdvancedPanel = realAdvancedPanel ;
	},
	
	
	handleActionDay: function( actionDay, dSql ) {
		var txt ;
		switch( actionDay ) {
			case 'open' :
				txt = 'Ouverture' ;
				break ;
			case 'valid_ceq':
			case 'valid_rh' :
				txt = null ;
				break ;
			case 'reopen' :
				txt = 'Reprendre la saisie pour' ;
				break ;
			case 'delete' :
				txt = 'ATTENTION ! Supprimer toutes données pour' ;
				break ;
			default: 
				break ;
		}
		if( txt==null ) {
			this.doActionDay(actionDay,dSql) ;
			return ;
		}
		Ext.MessageBox.confirm('Day Action', txt + ' jour '+dSql+' ?', function(buttonStr) {
			if( buttonStr!='yes' ) {
				return ;
			}
			this.doActionDay(actionDay,dSql) ;
		},this) ;
	},
	doActionDay: function( actionDay, dSql ) {
		this.showLoadmask() ;
		
		var filterSiteBtn = this.down('#btnSite'),
			filterTeamBtn = this.down('#btnTeam') ;
		
		var ajaxParams = {
			_moduleId: 'spec_dbs_people',
			_action: 'Real_actionDay',
			_subaction: actionDay,
			date_sql: dSql
		};
		if( filterSiteBtn.getNode() != null ) {
			ajaxParams['filter_site_entries'] = Ext.JSON.encode( filterSiteBtn.getLeafNodesKey() ) ;
		}
		ajaxParams['filter_site_txt'] = filterSiteBtn.getText() ;
		if( filterTeamBtn.getNode() != null ) {
			ajaxParams['filter_team_entries'] = Ext.JSON.encode( filterTeamBtn.getLeafNodesKey() ) ;
		}
		ajaxParams['filter_team_txt'] = filterTeamBtn.getText() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams,
			success: function(response) {
				this.hideLoadmask() ;
				if( Ext.JSON.decode(response.responseText).success != true ) {
					Ext.MessageBox.alert('Erreur','Impossible de valider le statut.') ;
					return ;
				}
				switch( actionDay ) {
					case 'valid_ceq':
					case 'valid_rh' :
						this.openValidConfirm(ajaxParams, Ext.JSON.decode(response.responseText)) ;
						break ;
					default :
						this.doLoad() ;
						break ;
				}
			},
			scope: this
		}) ;
	},
	openValidConfirm: function( postParams, jsonResponse ) {
		
		var validConfirmPanel = Ext.create('Optima5.Modules.Spec.DbsPeople.RealConfirmPanel',{
			parentRealPanel: this,
			width:600, // dummy initial size, for border layout to work
			height:null, // ...
			floating: true,
			renderTo: this.getEl(),
			tools: [{
				type: 'close',
				handler: function(e, t, p) {
					p.ownerCt.destroy();
				},
				scope: this
			}],
			data: {
				actionDay: postParams._subaction,
				date_sql: postParams.date_sql,
				filter_site_txt: postParams.filter_site_txt,
				filter_team_txt: postParams.filter_team_txt,
				people_count: jsonResponse.people_count,
				exception_rows: jsonResponse.exception_rows
			}
		});
		
		validConfirmPanel.on('destroy',function(validConfirmPanel) {
			this.getEl().unmask() ;
		},this,{single:true}) ;
		
		validConfirmPanel.on('submit',function(validConfirmPanel) {
			validConfirmPanel.getEl().mask('Validating...') ;
			this.optimaModule.getConfiguredAjaxConnection().request({
				params: Ext.merge(postParams,{
					_do_valid: 1
				}),
				callback: function() {
					validConfirmPanel.getEl().unmask ;
				},
				success: function(response) {
					if( Ext.JSON.decode(response.responseText).success != true ) {
						Ext.MessageBox.alert('Problem','Impossible de valider le statut, veuillez vérifier les anomalies.') ;
						return ;
					}
					validConfirmPanel.destroy() ;
					this.doLoad() ;
				},
				scope: this
			}) ;
		},this) ;
		
		this.getEl().mask() ;
		
		validConfirmPanel.show();
		validConfirmPanel.getEl().alignTo(this.getEl(), 'c-c?');
	},
	handleExceptionDay: function( dSql, trueOrFalse ) {
		this.showLoadmask() ;
		
		var ajaxParams = {
			_moduleId: 'spec_dbs_people',
			_action: 'Real_exceptionDaySet',
			exception_is_on: ( trueOrFalse ? 1:0 ),
			date_sql: dSql
		};
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams,
			success: function(response) {
				this.hideLoadmask() ;
				if( Ext.JSON.decode(response.responseText).success != true ) {
					Ext.MessageBox.alert('Problem','Impossible de changer le statut.') ;
					return ;
				}
				this.doLoad() ;
			},
			scope: this
		}) ;
	},
	remoteSavePeopledayRecord: function( peopledayRecord ) {
		if( peopledayRecord.get('status_isVirtual') ) {
			this.onAfterSave() ;
			return ;
		}
		
		var ajaxParams = {
			_moduleId: 'spec_dbs_people',
			_action: 'Real_saveRecord',
			data: Ext.JSON.encode( peopledayRecord.getData(true) )
		};
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams,
			success: function(response) {
				if( Ext.JSON.decode(response.responseText).success != true ) {
					Ext.MessageBox.alert('Problem','Edit not saved !') ;
				}
				this.onAfterSave() ;
			},
			scope: this
		}) ;
	},
	onAfterSave: function() {
		if( this.autoRefreshAfterEdit ) {
			this.autoRefreshAfterEdit = false ;
			this.doLoad() ;
		}
	},
	
	
	handleQuit: function() {
		this.destroy() ;
	}
});