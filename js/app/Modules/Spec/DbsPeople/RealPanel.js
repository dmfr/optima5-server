Ext.define('DbsPeoplePeopledayWorkModel',{
	extend: 'Ext.data.Model',
	fields: [
		{name: 'cli_code', type:'string'},
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
		{name: 'people_name',  type: 'string'},
		{name: 'fields',   type: 'auto'},
		{name: 'std_team_code',   type: 'string'},
		{name: 'std_whse_code',   type: 'string'},
		{name: 'std_role_code',   type: 'string'},
		{name: 'std_abs_code',   type: 'string'},
		{name: 'std_contract_code',   type: 'string'},
		{name: 'std_daylength',   type: 'number'},
		{name: 'std_daylength_min',   type: 'number'},
		{name: 'std_daylength_max',   type: 'number'},
		{name: 'std_daylength_contract',   type: 'number'},
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
		{name: '_visible', type:'boolean'},
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
		{name: 'dummy',   type: 'string'}
	]
});

Ext.define('Optima5.Modules.Spec.DbsPeople.RealPanelCellEditing',{
	extend: 'Ext.grid.plugin.CellEditing',
	onSpecialKey: function(ed, field, e) {
		switch( e.getKey() ) {
			case e.UP :
			case e.DOWN :
			case e.LEFT :
			case e.RIGHT :
				return this.onSpecialKeyNav.apply(this,arguments) ;
			
			case e.TAB :
			case e.PAGE_UP :
			case e.PAGE_DOWN :
				e.stopEvent() ;
				break ;
		}
	},
	onSpecialKeyNav: function(ed, field, e) {
		e.stopEvent() ;
		
		var columnHeader = this.getActiveColumn(),
			record = this.getActiveRecord(),
			editingContext = this.getEditingContext(record,columnHeader),
			view,
			editorField ;
		if( !editingContext ) {
			return ;
		}
		view = columnHeader.getOwnerHeaderCt().view ;
		
		editorField = columnHeader.getEditor() ;
		if( editorField && editorField.listKeyNav && editorField.listKeyNav.map.isEnabled() ) {
			return ; // HACK : using BoundListKeyNav private property
		}
		
		var curColIdx = editingContext.colIdx,
			curRowIdx = editingContext.rowIdx,
			offsetCol = 0,
			offsetRow = 0 ;
		switch( e.getKey() ) {
			case e.UP :
				offsetRow-- ;
				break ;
			case e.DOWN :
				offsetRow++ ;
				break ;
			case e.LEFT :
				offsetCol-- ;
				break ;
			case e.RIGHT :
				offsetCol++ ;
				break ;
		}
		var nbTries = 4, node, columnHeader, record, valueObj ;
		while( nbTries > 0 ) {
			nbTries-- ;
			
			curColIdx += offsetCol ;
			curRowIdx += offsetRow ;
			if( curColIdx < 0 || curRowIdx < 0 ) {
				break ;
			}
			
			node = view.getNode(curRowIdx) ;
			if( !node ) {
				break ;
			}
			record = view.getRecord(node) ;
			valueObj = record.get(columnHeader.dataIndex) ;
			if( !valueObj ) {
				break ;
			}
			
			columnHeader = this.grid.getColumnManager().getHeaderAtIndex(curColIdx) ;
			if( !columnHeader ) {
				break ;
			}
			
			if( !valueObj._editable ) {
				valueObj = null ;
				continue ;
			}
			
			break ;
		}
		
		// completeEdit
		this.completeEdit() ;
		
		if( !valueObj ) {
			return ;
		}
		// start new edit
		this.startEdit(record, columnHeader) ;
	},
	getEditor: function(record, column) {
		var editor = this.callParent(arguments) ;
		editor.completeOnEnter = false ;
		return editor ;
	}
});

Ext.define('Optima5.Modules.Spec.DbsPeople.RealPanel',{
	extend:'Ext.panel.Panel',
	
	requires:[
		'Optima5.Modules.Spec.DbsPeople.RealAdvancedPanel',
		'Optima5.Modules.Spec.DbsPeople.RealVirtualPanel',
		'Optima5.Modules.Spec.DbsPeople.CfgParamSiteButton',
		'Optima5.Modules.Spec.DbsPeople.CfgParamTeamButton',
		'Optima5.Modules.Spec.DbsPeople.RealConfirmPanel',
		'Optima5.Modules.Spec.DbsPeople.RealSummaryPanel',
		'Optima5.Modules.Spec.DbsPeople.RealDayPrintTable'
	],
	
	dateStart: null,
	dateEnd: null,
	
	peopledayStore: null,
	
	autoRefreshDelay: (5*60*1000),
	autoRefreshTask: null,
	autoRefreshAfterEdit: false,
	
	modifiedCells: null,
	
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
		
		this.tmpModelName = 'DbsPeopleRealRowModel-' + this.getId() ;
		this.on('destroy',function(p) {
			Ext.ux.dams.ModelManager.unregister( p.tmpModelName ) ;
		}) ;
		
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
	helperGetCliTxt: function( cliCode ) {
		return Optima5.Modules.Spec.DbsPeople.HelperCache.forTypeGetById("CLI",cliCode).text ;
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
			dateStart = Ext.clone(me.dateStart),
			dateEnd = Ext.clone(me.dateEnd) ;
			
		me.modifiedCells = {} ;
			
		var getStatusTdCls = function( statusStr ) {
			switch( statusStr ) {
				case 'virtual' :
					return 'op5-spec-dbspeople-realcell-virtual' ;
				case 'open' :
					return 'op5-spec-dbspeople-realcolor-open' ;
				case 'openrh' :
					return 'op5-spec-dbspeople-realcolor-openrh' ;
				case 'closed' :
					return '' ;
			}
		}
		var getStatusTdClsForModified = function( rowId, colIdx ) {
			var modifiedCells = me.modifiedCells ;
			if( modifiedCells[rowId] && modifiedCells[rowId][colIdx] ) {
				return 'op5-spec-dbspeople-realcolor-dirty' ;
			}
			return '' ;
		}
		
		var comboboxData = [] ;
		Ext.Array.each( Optima5.Modules.Spec.DbsPeople.HelperCache.forTypeGetAll("ROLE"), function(roleRec) {
			comboboxData.push({
				id: 'ROLE:'+roleRec.id,
				shortText: roleRec.id,
				text: roleRec.text
			});
		}) ;
		Ext.Array.each( Optima5.Modules.Spec.DbsPeople.HelperCache.forTypeGetAll("ABS",true), function(absRec) {
			if( absRec.id.charAt(0) == '_' ) {
				return ;
			}
			comboboxData.push({
				id: 'ABS:'+absRec.id,
				shortText: absRec.id,
				text: 'ABS-'+absRec.text
			});
		}) ;
		
		var virtualRoles = [] ;
		Ext.Array.each( Optima5.Modules.Spec.DbsPeople.HelperCache.forTypeGetAll("ROLE"), function(roleDesc) {
			if( roleDesc.is_virtual ) {
				virtualRoles.push(roleDesc.id) ;
			}
		}) ;
		var roleRenderer = function(value, metaData, record, rowIndex, colIndex) {
			if( Ext.isEmpty(value) ) {
				return '' ;
			}
			
			metaData.tdCls += ' ' + getStatusTdCls(value.statusStr) + ' ' + getStatusTdClsForModified(record.getId(),colIndex) ;
			
			if( value.statusIsVirtual ) {
				if( value.stdEmpty ) {
					return '' ;
				}
				if( value.stdAbs != null ) {
					metaData.tdCls += ' op5-spec-dbspeople-realcell-absplanning' ;
					return value.stdAbs ;
				} else {
					return value.stdRole ;
				}
			}
			
			var rolesStr = [] ;
			if( value.hasAlt ) {
				rolesStr.push('@') ;
				metaData.tdCls += ' op5-spec-dbspeople-realcolor-whse' ;
			}
			if( value.roles ) {
				var roles=value.roles, rolesLn=roles.length, role ;
				for( var i=0 ; i<rolesLn ; i++ ) {
					role = roles[i] ;
					if( role != value.stdRole ) {
						rolesStr.push( '<span class="op5-spec-dbspeople-realcell-diff">' + role + '</span>' ) ;
					} else if( Ext.Array.contains(virtualRoles,role) ) {
						rolesStr.push( '<span class="op5-spec-dbspeople-realcell-rolevirtual">' + role + '</span>' ) ;
					} else {
						rolesStr.push( role ) ;
					}
				}
			}
			if( value.abs ) {
				var abs=value.abs, absLn=abs.length, ab ;
				for( var i=0 ; i<absLn ; i++ ) {
					ab = abs[i] ;
					var cls = (ab == value.stdAbs ? 'op5-spec-dbspeople-realcell-absplanning' : 'op5-spec-dbspeople-realcell-absent') ;
					rolesStr.push( '<span class="'+cls+'">' + ab + '</span>' ) ;
				}
			}
			if( rolesStr.length == 0 && !value.stdEmpty ) {
				metaData.tdCls += ' op5-spec-dbspeople-realcolor-anomalie' ;
			}
			return rolesStr.join('+') ;
		}
		
		var lengthRenderer = function(value, metaData, record, rowIndex, colIndex) {
			if( Ext.isEmpty(value) ) {
				return '' ;
			}
			
			metaData.tdCls += ' ' + getStatusTdCls(value.statusStr) + ' ' + getStatusTdClsForModified(record.getId(),colIndex) ;
			
			if( value.statusIsVirtual ) {
				return ( value.stdValue > 0 ? value.stdValue : '' ) ;
			}
			
			if( value.stdValue ) {
				if( value.totalValue < value.minValue ) {
					metaData.tdCls += ' op5-spec-dbspeople-realcolor-anomalie' ;
				} else if( value.workValue < value.stdValue ) {
					metaData.tdCls += ' op5-spec-dbspeople-balance-neg' ;
				} else if( value.workValue > value.stdValue ) {
					metaData.tdCls += ' op5-spec-dbspeople-balance-pos' ;
				}
			}
			
			if( value.stdValue==0 && value.workValue==0 ) {
				return '' ;
			}
			return value.value ;
		}
		
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
			_groupBy: 'contract_code',
			hideable: true
		},{
			locked: true,
			text: 'RôleStd',
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
		Ext.Array.each( Optima5.Modules.Spec.DbsPeople.HelperCache.getPeopleFields(), function( peopleField ) {
			var fieldColumn = {
				locked: true,
				text: peopleField.text,
				dataIndex: peopleField.field,
				_groupBy: peopleField.field,
				hideable: true,
				hidden: true,
				width: 100
			} ;
			if( peopleField.type=='link' ) {
				Ext.apply(fieldColumn,{
					renderer: function(v) {
						return v.text ;
					}
				}) ;
			}
			columns.push(fieldColumn) ;
			
			var fieldType ;
			switch( peopleField.type ) {
				case 'link' :
					fieldType='auto' ;
					break ;
				default:
					fieldType='string' ;
					break ;
			}
			pushModelfields.push({
				name: peopleField.field,
				type: fieldType
			});
		}) ;
		for( var d = dateStart ; d <= dateEnd ; d.setDate( d.getDate() + 1 ) ) {
			var dStr = Ext.Date.format(d,'Ymd'),
				dSql = Ext.Date.format(d,'Y-m-d');
			
			pushModelfields.push({
				name:'d_'+dStr+'_role',
				type:'auto'
			}) ;
			pushModelfields.push({
				name:'d_'+dStr+'_tmp',
				type:'auto'
			}) ;
			
			columns.push({
				text: Optima5.Modules.Spec.DbsPeople.HelperCache.DayNamesIntl.FR[d.getDay()] + ' ' + Ext.Date.format(d,'d/m'),
				dateSqlHead: dSql,
				dateStrHead: dStr,
				columns: [{
					text: 'Role',
					menuDisabled: true,
					dataIndex: 'd_'+dStr+'_role',
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
								'{[typeof values === "string" ? values : values["shortText"]]}',
								'<tpl if="xindex < xcount">' + ',' + '</tpl>',
							'</tpl>'
						],
						valueField: 'id',
						store: {
							fields: ['id','shortText','text'],
							data : comboboxData
						},
						matchFieldWidth: false,
						listeners: {
							focus: {
								fn: function(cmb) {
									if(cmb.keyNav) {
										cmb.keyNav.disable() ;  //HACK : destroy combo.keyNav from being created
									}
								},
								single: true
							}
						}
					},
					renderer: roleRenderer
				},{
					text: 'Tmp',
					menuDisabled: true,
					dataIndex: 'd_'+dStr+'_tmp',
					dateHash: 'd_'+dStr,
					dateSql: dSql,
					width:50,
					editor: { xtype: 'numberfield', minValue: 0, keyNavEnabled: false },
					renderer: lengthRenderer
				}]
			}) ;
		}
		
		Ext.define(this.tmpModelName, {
			extend: 'DbsPeopleRealRowModel',
			fields: pushModelfields
		});
		
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
				model: this.tmpModelName,
				data: [],
				sorters: [{
					property: 'people_name',
					direction: 'ASC'
				}],
				filters: [{
					property: '_visible',
					value: true
				}],
				proxy:{
					type:'memory'
				},
				listeners: {
					groupchange: me.onGridGroupChange,
					scope: this
				}
			},
			enableLocking: true,
			plugins: [Ext.create('Optima5.Modules.Spec.DbsPeople.RealPanelCellEditing',{
				pluginId: 'cellediting',
				clicksToEdit: 1,
				listeners: {
					beforeedit: me.onGridBeforeEdit,
					validateedit: me.onGridAfterEdit,
					scope: me
				},
				lockableScope: 'normal'
			}),{
				ptype: 'bufferedrenderer',
				pluginId: 'bufferedRenderer',
				lockableScope: 'both',
				synchronousRender: true
			}],
			features: [{
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
									var peopleField = Optima5.Modules.Spec.DbsPeople.HelperCache.getPeopleField(values.groupField) ;
									if( peopleField != null ) {
										var value = values.rows[0].data[peopleField.field],
											returnText ;
										switch( peopleField.type ) {
											case 'link' :
												returnText = value.text ;
												break ;
											default :
												returnText = value ;
												break ;
										}
										if( Ext.isEmpty(returnText) ) {
											return '(Pas de donnée)' ;
										}
										return returnText ;
									}
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
					gridpanel.headerCt.on('columnschanged',me.onColumnsChanged,me) ;
				},
				itemcontextmenu: function( gridview, record, node, index, e ) {
					var cellNode = e.getTarget(gridview.cellSelector);
					
					var gridRecord = record,
						column = gridview.getHeaderByCell(cellNode),
						colIdx = gridview.ownerCt.getVisibleColumnManager().getHeaderIndex(column),
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
					
					// Modif 2014-09 : modified cells
					this.tagModifiedCell(gridRecord.getId(),colIdx) ;
					
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
				icon: 'images/op5img/ico_print_16.png',
				itemId: 'grid-print',
				text: 'Print',
				handler: function(menuitem) {
					this.handlePrintPanel( menuitem.up('menu').activeHeader.dateSqlHead ) ;
				},
				scope: this
			});
			menu.add({
				itemId: 'grid-summary',
				iconCls: 'op5-spec-dbspeople-icon-actionday-summary',
				text: 'Compteurs ETP',
				handler: function(menuitem,e) {
					this.openSummary( menuitem.up('menu').activeHeader.dateSqlHead ) ;
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
		menu.down('#grid-print').setVisible( colCfg ) ;
		menu.down('#grid-summary').setVisible( colCfg ) ;
		menu.down('menuseparator').setVisible( colCfg ) ;
		menu.down('#real-open').setVisible( colCfg && colCfg.enable_open && !colCfg.status_earlyLocked && HelperCache.authHelperQueryPage('CEQ') ) ;
		menu.down('#real-valid-ceq').setVisible( colCfg && colCfg.enable_valid_ceq && HelperCache.authHelperQueryPage('CEQ') ) ;
		menu.down('#real-valid-rh').setVisible( colCfg && colCfg.enable_valid_rh && HelperCache.authHelperQueryPage('RH') ) ;
		menu.down('#real-reopen').setVisible( colCfg && !colCfg.enable_open && !colCfg.enable_valid_ceq && !colCfg.enable_valid_rh && HelperCache.authHelperQueryPage('ADMIN') ) ;
		menu.down('#real-delete').setVisible( colCfg && HelperCache.authHelperQueryPage('ADMIN') ) ;
		menu.down('#real-checkbox-exceptionday').setVisible( colCfg && colCfg.status_virtual && HelperCache.authHelperQueryPage('RH') ) ;
		menu.down('#real-checkbox-exceptionday').setChecked( colCfg && colCfg.status_exceptionDay, true ) ;
	},
	onColumnsChanged: function() {
		var grid = this.child('grid'),
			store = grid.getStore() ;
		if( store.getCount() == 0 ) {
			return ;
		}
		grid.getView().refresh() ; // HACK
	},
	onColumnGroupBy: function( groupField ) {
		var grid = this.child('grid'),
			store = grid.getStore() ;
		grid.normalGrid.getPlugin('bufferedRenderer').scrollTo(0) ;
		grid.lockedGrid.getPlugin('bufferedRenderer').scrollTo(0) ;
		store.group( groupField, 'ASC' ) ;
	},
	onGridGroupChange: function( gridStore, groupers ) {
		var grid = this.child('grid'),
			 groupFields = [] ;
		groupers.each( function(grouper) {
			groupFields.push(grouper.property) ;
		}) ;
		Ext.Array.each( grid.headerCt.query('[_groupBy]'), function(col) {
			if( col.hideable ) {
				return ;
			}
			if( col._alwaysHidden ) {
				col.hide() ;
			} else if( Ext.Array.contains(groupFields , col._groupBy) ) {
				col.hide() ;
			} else {
				col.show() ;
			}
		}) ;
		grid.getView().refresh() ; // HACK
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
		var me = this,
			jsonResponse = Ext.JSON.decode(response.responseText) ;
		
		var grid = me.child('grid') ;
			store = grid.getStore(),
			filter_site = me.down('#btnSite').getNode(),
			filter_team = me.down('#btnTeam').getNode() ;
			
		// Cfg columns visibility + groups according to current filters
		grid.headerCt.down('[dataIndex="whse_txt"]')._alwaysHidden = (filter_site && filter_site.leaf_only) ;
		grid.headerCt.down('[dataIndex="team_txt"]')._alwaysHidden = (filter_team && filter_team.leaf_only) ;
		if( filterChanged ) {
			store.removeAll() ; // To avoid sorting/grouping obsolete records
			if( filter_site==null || !filter_site.leaf_only ) {
				store.group( 'whse_code', 'ASC' ) ;
			} else if( filter_team==null || !filter_team.leaf_only ) {
				store.group( 'team_code', 'ASC' ) ;
			} else {
				store.clearGrouping() ;
			}
		}
		
		// Set "exception day" + "Alert Due" style
		Ext.Object.each( jsonResponse.columns, function( dSql, colCfg ) {
			var column = grid.headerCt.down('[dateSqlHead="'+dSql+'"]') ;
			column.colCfg = colCfg ;
			column[colCfg.status_alertDue ? 'addCls':'removeCls']('op5-spec-dbspeople-realcolor-alertdue') ;
			Ext.Array.each( column.query('gridcolumn'), function(subCol) {
				subCol.tdCls = '' ;
				subCol.tdCls += ( colCfg.status_exceptionDay ? ' '+'op5-spec-dbspeople-realcolor-exceptionday' : '') ;
			}) ;
		},this) ;
		
		
		// peopledayStore + adapter (re)init
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
		this.gridAdapterInit() ;
		store.group() ;
		
		// Drop loadmask
		this.hideLoadmask();
		
		// Setup autoRefresh task
		this.autoRefreshTask.delay( this.autoRefreshDelay ) ;
	},
	
	gridAdapterInit: function() {
		var grid = this.child('grid'),
			store = grid.getStore(),
			dateMap = this.gridAdapterGetDateMap(),
			gridData = {} ;
		
		this.peopledayStore.each( function(peopledayRecord) {
			this.gridAdapterPopulateForPeopledayRecord( gridData, peopledayRecord, dateMap ) ;
		},this) ;
		
		gridData = this.gridAdapterGridFilter(gridData) ;
		
		store.loadRawData( gridData ) ;
	},
	gridAdapterUpdatePeopledayRecord: function(peopledayRecord) {
		var grid = this.child('grid'),
			 store = grid.getStore(),
			 dateMap = this.gridAdapterGetDateMap() ;
		
		store.suspendEvents() ; // HACK: suspendingEvents on bufferedgrid'store is dangerous
		
		// mise à zero de toutes les 'cases' concernées par ce record (people + date)
		var dateSql = peopledayRecord.get('date_sql'),
			dateStr = dateMap[dateSql] ;
		if( dateStr == null ) {
			return ; // hors champ
		}
		var roleKey = 'd_'+dateStr+'_role',
			durationKey = 'd_'+dateStr+'_tmp',
			nullObj = {},
			gridRecordIdsToDelete = [] ;
		nullObj[roleKey] = '' ;
		nullObj[durationKey] = '' ;
		store.data.each( function(gridRec) {
			if( gridRec.get('people_code') != peopledayRecord.get('people_code') ) {
				return ;
			}
			
			gridRec.set(nullObj) ;
			gridRec.commit() ;
			
			// Is gridRow empty ?
			var isGridRowEmpty = true ;
			Ext.Object.each( dateMap, function(dateSql,dateStr) {
				var roleKey = 'd_'+dateStr+'_role',
					durationKey = 'd_'+dateStr+'_tmp' ;
				if( !Ext.isEmpty(gridRec.get(roleKey)) || !Ext.isEmpty(gridRec.get(durationKey)) ) {
					isGridRowEmpty = false ;
				}
			}) ;
			if( isGridRowEmpty && gridRec.get('whse_code') != peopledayRecord.get('std_whse_code') ) {
				gridRecordIdsToDelete[gridRec.getId()] = true ;
			}
		}) ;
		
		// construction d'une grid data partielle
		var gridData = {}
		this.gridAdapterPopulateForPeopledayRecord( gridData, peopledayRecord, dateMap ) ;
		
		gridData = this.gridAdapterGridFilter(gridData) ;
		
		var gridRecordsToAdd = [] ;
		// fusion avec le store existant
		Ext.Array.each( gridData, function( gridDataRow ) {
			var gridDataRowId = gridDataRow.id ;
			// row record exists ?
			var gridRec = store.getById( gridDataRowId ) ;
			if( gridRec != null ) {
				gridRecordIdsToDelete[gridRec.getId()] = false ;
				gridRec.set(gridDataRow) ;
				gridRec.commit() ;
			} else {
				gridRecordsToAdd.push(gridDataRow) ;
			}
		}) ;
		
		store.resumeEvents() ; // HACK: need to resume -BEFORE- add/remove record(s)
		
		if( gridRecordsToAdd.length > 0 ) {
			store.add(gridRecordsToAdd) ;
		}
		var gridRecordsToDelete = [] ;
		Ext.Object.each( gridRecordIdsToDelete, function(gridDataRowId,tOrF) {
			if( tOrF ) {
				var gridRec = store.getById(gridDataRowId) ;
				if( gridRec != null ) {
					gridRecordsToDelete.push(gridRec) ;
				}
			}
		}) ;
		if( gridRecordsToDelete.length > 0 ) {
			store.remove(gridRecordsToDelete) ;
		}
		
		if( gridRecordsToAdd.length > 0 ) { // more than 1 => alt warehouses and possible inserts
			store.filter() ;
		}
		grid.getView().refresh() ; //HACK
	},
	gridAdapterGridFilter: function( gridData ) {
		var filterBtn_site = this.down('#btnSite'),
			filterBtn_team = this.down('#btnTeam'),
			filter_whses = ( filterBtn_site.getNode()==null ? null : filterBtn_site.getLeafNodesKey() ),
			filter_teams = ( filterBtn_team.getNode()==null ? null : filterBtn_team.getLeafNodesKey() ) ;
		
		var filterFn = function(rec) {
		}
		
		if( Ext.isObject(gridData) ) {
			var gridData = Ext.Object.getValues(gridData) ;
		}
		var gridDataRow, gridDataLn = gridData.length, visible ;
		for( var i=0 ; i<gridDataLn ; i++ ) {
			gridDataRow = gridData[i] ;
			
			visible = true ;
			if( filter_whses && !Ext.Array.contains(filter_whses,gridDataRow.whse_code) ) {
				visible = false ;
			}
			if( filter_teams && !Ext.Array.contains(filter_teams,gridDataRow.team_code) ) {
				visible = false ;
			}
			
			gridDataRow._visible = visible ;
		}
		return gridData ;
	},
	gridAdapterPopulateForPeopledayRecord: function( gridData, peopledayRecord, dateMap ) {
		if( dateMap == null ) {
			dateMap = this.gridAdapterGetDateMap() ;
		}
		var dateSql = peopledayRecord.get('date_sql'),
			dateStr = dateMap[dateSql] ;
		if( dateStr == null ) {
			return ; // hors champ
		}
		
		var stdWhseCode = peopledayRecord.data.std_whse_code,
			stdTeamCode = peopledayRecord.data.std_team_code,
			stdRoleCode = peopledayRecord.data.std_role_code,
			stdAbsCode = peopledayRecord.data.std_abs_code,
			stdAbsHalfDay = false,
			stdContractCode = peopledayRecord.data.std_contract_code,
			stdDayLength = peopledayRecord.data.std_daylength,
			stdDayLengthMin = peopledayRecord.data.std_daylength_min,
			stdDayLengthMax = peopledayRecord.data.std_daylength_max,
			peopleCode = peopledayRecord.data.people_code ;
		
		var altWhsesSegments = null,
			workDuration = 0,
			absDuration = 0,
			statusIsVirtual = false,
			statusStr = '',
			segments = {
				roles:[],
				abs:[],
				roles_duration:0
			} ;
		
		if( peopledayRecord.data.status_isVirtual == true ) {
			statusIsVirtual = true ;
			statusStr = 'virtual' ;
		}
		else if( !peopledayRecord.data.status_isValidCeq && !peopledayRecord.data.status_isValidRh ) {
			statusStr = 'open' ;
		}
		else if( !peopledayRecord.data.status_isValidRh ) {
			statusStr = 'openrh' ;
		}
		else {
			statusStr = '' ;
		}
		
		if( stdAbsCode.charAt(0) == '_' ) {
			stdAbsCode = null ;
		} else {
			if( stdAbsCode.split(':')[1] == '2' ) {
				stdAbsHalfDay = true ;
				stdDayLength = stdDayLength / 2 ;
			}
		}
		
		peopledayRecord.works().each( function(workRecord) {
			workDuration += workRecord.data.role_length ;
			if( !Ext.isEmpty(workRecord.data.alt_whse_code) ) {
				var altWhseCode = workRecord.data.alt_whse_code ;
				if( altWhsesSegments == null ) {
					altWhsesSegments = {} ;
				}
				if( !altWhsesSegments.hasOwnProperty(altWhseCode) ) {
					altWhsesSegments[altWhseCode] = {
						roles:[],
						roles_duration:0
					};
				}
				altWhsesSegments[altWhseCode].roles.push(workRecord.data.role_code) ;
				altWhsesSegments[altWhseCode].roles_duration += workRecord.data.role_length ;
				return ;
			}
			segments.roles.push(workRecord.data.role_code) ;
			segments.roles_duration += workRecord.data.role_length ;
		}) ;
		peopledayRecord.abs().each( function(absRecord) {
			absDuration += absRecord.data.abs_length ;
			segments.abs.push(absRecord.data.abs_code) ;
		}) ;
		
		
		var roleKey = 'd_'+dateStr+'_role',
			durationKey = 'd_'+dateStr+'_tmp' ;
			
		var gridDataRowId = stdWhseCode+'%'+stdTeamCode+'%'+peopleCode ;
		if( !gridData.hasOwnProperty(gridDataRowId) ) {
			gridData[gridDataRowId] = Ext.apply({
				id: gridDataRowId,
				whse_code: stdWhseCode,
				whse_isAlt: false,
				team_code: stdTeamCode,
				contract_code: stdContractCode,
				std_role_code: stdRoleCode,
				people_code: peopledayRecord.data.people_code,
				people_name: peopledayRecord.data.people_name
			},peopledayRecord.data.fields) ;
		}
		var gridDataRow = gridData[gridDataRowId] ;
		gridDataRow[roleKey] = {
			statusStr: statusStr,
			statusIsVirtual: statusIsVirtual,
			roles: segments.roles,
			abs: segments.abs,
			stdRole: stdRoleCode,
			stdAbs: stdAbsCode,
			stdEmpty: (stdDayLength == 0),
			hasAlt: (altWhsesSegments != null)
		} ;
		gridDataRow[durationKey] = {
			statusStr: statusStr,
			statusIsVirtual: statusIsVirtual,
			value: segments.roles_duration,
			workValue: workDuration,
			totalValue: (workDuration + absDuration),
			stdValue: ( (stdAbsCode == null || stdAbsHalfDay) ? stdDayLength : 0 ),
			minValue: ( stdAbsCode == null ? stdDayLengthMin : 0 )
		} ;
		if( !statusIsVirtual && segments.roles.length == 1 && segments.abs.length == 0 ) {
			gridDataRow[roleKey]._editable = true ;
			gridDataRow[roleKey]._editorValue = 'ROLE:'+segments.roles[0] ;
			gridDataRow[durationKey]._editable = true ;
			gridDataRow[durationKey]._editorValue = segments.roles_duration ;
			gridDataRow[durationKey]._editorMaxValue = stdDayLengthMax ;
		}
		if( !statusIsVirtual && segments.roles.length == 0 && segments.abs.length == 1 ) {
			gridDataRow[roleKey]._editable = true ;
			gridDataRow[roleKey]._editorValue = 'ABS:'+segments.abs[0] ;
		}
		
		if( altWhsesSegments == null ) {
			return ;
		}
		Ext.Object.each( altWhsesSegments, function( altWhseCode, segments ) {
			var gridDataRowId = '@'+altWhseCode+'%'+stdTeamCode+'%'+peopleCode ;
			if( !gridData.hasOwnProperty(gridDataRowId) ) {
				gridData[gridDataRowId] = Ext.apply({
					id: gridDataRowId,
					whse_code: altWhseCode,
					whse_isAlt: true,
					team_code: stdTeamCode,
					contract_code: stdContractCode,
					std_role_code: stdRoleCode,
					people_code: peopledayRecord.data.people_code,
					people_name: peopledayRecord.data.people_name
				},peopledayRecord.data.fields) ;
			}
			var gridDataRow = gridData[gridDataRowId] ;
			gridDataRow[roleKey] = {
				roles: segments.roles,
				stdRole: stdRoleCode,
				stdEmpty: true
			} ;
			gridDataRow[durationKey] = {
				value: segments.roles_duration
			} ;
		}) ;
	},
	gridAdapterGetDateMap: function() {
		var grid = this.child('grid'),
			dateCols = grid.headerCt.query('[dateSqlHead]'),
			dateMap = {} ;
		Ext.Array.each( dateCols, function(dateCol) {
			dateMap[dateCol.dateSqlHead] = dateCol.dateStrHead ;
		}) ;
		return dateMap ;
	},
	
	tagModifiedCell: function( rowId, colIdx ) {
		var objModifiedCells = this.modifiedCells ;
			
		if( !objModifiedCells.hasOwnProperty(rowId) ) {
			objModifiedCells[rowId] = {} ;
		}
		if( !objModifiedCells[rowId].hasOwnProperty(colIdx) ) {
			objModifiedCells[rowId][colIdx] = true ;
		}
	},
	
	onGridBeforeEdit: function( editor, editEvent ) {
		var gridRecord = editEvent.record,
			column = editEvent.column,
			colIdx = editEvent.colIdx,
			valueObj = editEvent.value,
			dateSql = column.dateSql,
			peopleCode = gridRecord.data.people_code,
			peopledayId = peopleCode+'@'+dateSql ;
			peopledayRecord = this.peopledayStore.getById(peopledayId),
			peopledayWorkRecords = peopledayRecord.works().getRange(),
			peopledayAbsRecords = peopledayRecord.abs().getRange() ;
		
			
		if( valueObj.statusIsVirtual ) {
			return false ;
		}
		
		if( !this.hasPermissionToEdit( peopledayRecord ) ) {
			return false ;
		}
		
		// Modif 2014-09 : modified cells
		this.tagModifiedCell(gridRecord.getId(),colIdx) ;
		
		if( !valueObj._editable ) {
			var cellNode = Ext.DomQuery.select( '.x-grid-cell', editEvent.row )[colIdx] ;
			this.openAdvanced( peopledayRecord, gridRecord, cellNode ) ;
			return false ;
		}
		
		var editorField = editEvent.column.getEditor() ;
		switch( editorField.getXType() ) {
			case 'combobox' :
				editorField.on('focus',function(editorField) {
					editorField.setValue(valueObj._editorValue) ;
					editorField.focusInput() ;
				},this,{single:true}) ;
				break ;
			case 'numberfield' :
				editorField.on('focus',function(editorField) {
					editorField.setMaxValue( valueObj._editorMaxValue ) ;
					editorField.setValue(valueObj._editorValue) ;
				},this,{single:true}) ;
				break ;
				
			default :
				return false ;
		}
	},
	onGridAfterEdit: function( editor, editEvent ) {
		var gridRecord = editEvent.record,
			column = editEvent.column,
			colIdx = editEvent.colIdx,
			valueObj = editEvent.originalValue,
			newValue = editEvent.value,
			dateSql = column.dateSql,
			peopleCode = gridRecord.data.people_code,
			peopledayId = peopleCode+'@'+dateSql,
			peopledayRecord = this.peopledayStore.getById(peopledayId),
			peopledayWorkStore = peopledayRecord.works(),
			peopledayAbsStore = peopledayRecord.abs() ;
		if( valueObj.statusIsVirtual ) {
			return false ;
		}
		if( !valueObj._editable ) {
			return false ;
		}
		if( valueObj._editorValue == newValue ) {
			// Same value !
			gridRecord.commit() ;
			return false ;
		}
		
		var editorField = editEvent.column.getEditor(),
			editorValue ;
		switch( editorField.getXType() ) {
			case 'combobox' :
				editorValue = editorField.getValue() ;
				switch( editorValue.split(':')[0] ) {
					case 'ABS' :
						var absCode = editorValue.split(':')[1] ;
						if( Ext.isEmpty(Optima5.Modules.Spec.DbsPeople.HelperCache.forTypeGetById("ABS",absCode).id) ) {
							return false ;
						}
						// delete all + create record
						peopledayWorkStore.removeAll() ;
						peopledayAbsStore.removeAll() ;
						peopledayAbsStore.add({
							abs_code: absCode,
							abs_length: peopledayRecord.data.std_daylength
						}) ;
						break ;
						
					case 'ROLE' :
						var roleCode = editorValue.split(':')[1] ;
						if( Ext.isEmpty(Optima5.Modules.Spec.DbsPeople.HelperCache.forTypeGetById("ROLE",roleCode).id) ) {
							return false ;
						}
						if( peopledayWorkStore.getCount() == 1 && peopledayAbsStore.getCount() == 0 ) {
							// mode simple
							peopledayWorkStore.getAt(0).set('role_code',roleCode) ;
						} else {
							// delete all + create record
							peopledayAbsStore.removeAll() ;
							peopledayWorkStore.removeAll() ;
							peopledayWorkStore.add({
								role_code: roleCode,
								role_length: peopledayRecord.data.std_daylength
							}) ;
						}
						break ;
				}
				break ;
				
			case 'numberfield' :
				editorValue = editorField.getValue() ;
				if( !Ext.isNumeric(editorValue) ) {
					return false ;
				}
				if( !(peopledayWorkStore.getCount() == 1 && peopledayAbsStore.getCount() == 0) ) {
					return false ;
				}
				peopledayWorkStore.getAt(0).set('role_length',editorValue) ;
				break ;
				
			default :
				return false ;
		}
		
		this.gridAdapterUpdatePeopledayRecord( peopledayRecord ) ;
		this.remoteSavePeopledayRecord( peopledayRecord ) ;
		return false ;
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
		var widthLarge = !Optima5.Modules.Spec.DbsPeople.HelperCache.links_cli_isSilent( gridRecord.get('whse_code') ) ;
		this.openPopup( 'Optima5.Modules.Spec.DbsPeople.RealAdvancedPanel', peopledayRecord, gridRecord, htmlNode, widthLarge ) ;
	},
	openVirtual: function( peopledayRecord, gridRecord, htmlNode ) {
		this.openPopup( 'Optima5.Modules.Spec.DbsPeople.RealVirtualPanel', peopledayRecord, gridRecord, htmlNode ) ;
	},
	openPopup: function( className, peopledayRecord, gridRecord, htmlNode, widthLarge ) {
		var me = this ;
		me.openVirtualAfterPopup = false ;
		
		var realAdvancedPanel = Ext.create(className,{
			parentRealPanel: me,
			gridRecord: gridRecord,
			peopledayRecord: peopledayRecord,
			width:800, // dummy initial size, for border layout to work
			height:600, // ...
			floating: true,
			draggable: true,
			renderTo: me.getEl(),
			tools: [{
				type: 'close',
				handler: function(e, t, p) {
					var checkResult = p.ownerCt.doCheckBeforeSave() ;
					if( !Ext.isEmpty(checkResult) ) {
						Ext.MessageBox.alert('Erreur',checkResult) ;
						return ;
					}
					
					p.ownerCt.doSave() ;
					p.ownerCt.destroy();
				},
				scope: this
			}]
		});
		
		// Size + position
		realAdvancedPanel.setSize({
			width: (widthLarge ? 420 : 300),
			height: 300
		}) ;
		realAdvancedPanel.on('destroy',function(realAdvancedPanel) {
			this.gridAdapterUpdatePeopledayRecord( realAdvancedPanel.peopledayRecord ) ;
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
			realAdvancedPanel.getEl().alignTo(htmlNode, 'c-t?');
		}
		Optima5.Helper.floatInsideParent( realAdvancedPanel ) ;
		
		me.realAdvancedPanel = realAdvancedPanel ;
	},
	
	
	openSummary: function( dSql ) {
		// Filtres en cours
		var filterBtn_site = this.down('#btnSite'),
			filterBtn_team = this.down('#btnTeam'),
			filter_whses = ( filterBtn_site.getNode()==null ? null : filterBtn_site.getLeafNodesKey() ),
			filter_teams = ( filterBtn_team.getNode()==null ? null : filterBtn_team.getLeafNodesKey() ) ;
		
		this.getEl().mask() ;
		
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
		
		this.peopledayStore.each( function(peopledayRecord) {
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
			
		var summaryPanel = Ext.create('Optima5.Modules.Spec.DbsPeople.RealSummaryPanel',{
			parentRealPanel: this,
			width:350, // dummy initial size, for border layout to work
			height:null, // ...
			floating: true,
			draggable: true,
			resizable: true,
			renderTo: this.getEl(),
			tools: [{
				type: 'close',
				handler: function(e, t, p) {
					p.ownerCt.destroy();
				},
				scope: this
			}],
			data: {
				date_sql: dSql,
				filter_site_txt: (filter_whses ? filterBtn_site.getText() : null),
				filter_team_txt: (filter_teams ? filterBtn_team.getText() : null),
				summary_rows: summaryRows
			}
		});
		
		summaryPanel.on('destroy',function(summaryPanel) {
			this.getEl().unmask() ;
		},this,{single:true}) ;
		
		summaryPanel.show();
		summaryPanel.getEl().alignTo(this.getEl(), 'c-c?');
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
			draggable: true,
			resizable: true,
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
					validConfirmPanel.getEl().unmask() ;
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
	
	/*
	 * Borrowed from http://druckit.wordpress.com/2014/02/15/ext-js-4-printing-the-contents-of-an-ext-panel/
	 */
	handlePrintPanel: function( dSql ) {
		if( this.printFrame ) {
			this.printFrame.destroy() ;
			this.printFrame = null ;
		}
		
		var pnl = this.down('grid') ;
		
		// instantiate hidden iframe
		var printFrame = Ext.getBody().appendChild({
			tag: 'iframe',
			cls: 'x-hidden',
			style: {
				display: "none"
			}
		}),
		printFrameCw = printFrame.dom.contentWindow ;
		
		var realDayPrintTable = new Optima5.Modules.Spec.DbsPeople.RealDayPrintTable({
			dateSql: dSql,
			columns: pnl.headerCt.getGridColumns(),
			store: pnl.getStore()
		}),
		realDayPrintTableMarkup = Ext.DomHelper.markup( realDayPrintTable.getRenderTree() ) ;
		
		// instantiate application stylesheets in the hidden iframe
		var stylesheets = "";
		for (var i = 0; i < document.styleSheets.length; i++) {
				stylesheets += Ext.String.format('<link rel="stylesheet" href="{0}" />', document.styleSheets[i].href);
		}

		// various style overrides
		stylesheets += ''.concat(
			"<style>",
				".x-panel-body {overflow: visible !important;}",
				// experimental - page break after embedded panels
				// .x-panel {page-break-after: always; margin-top: 10px}",
			"</style>"
			);

		// get the contents of the panel and remove hardcoded overflow properties
		var markup = pnl.getEl().dom.innerHTML;
		var markup = Ext.DomHelper.markup( realDayPrintTable.getRenderTree() ) ;
		while (markup.indexOf('overflow: auto;') >= 0) {
			markup = markup.replace('overflow: auto;', '');
		}

		var str = Ext.String.format('<html><head>{0}</head><body>{1}</body></html>',stylesheets,realDayPrintTableMarkup);
		
		/*
		this.optimaModule.createWindow({
			items: Ext.create('Ext.ux.dams.IFrameContent',{
				content: str
			})
		}); 
		return ;
		*/
		
		// output to the iframe
		printFrameCw.document.open();
		printFrameCw.document.write(str);
		printFrameCw.document.close();

		// remove style attrib that has hardcoded height property
		printFrameCw.document.getElementsByTagName('DIV')[0].removeAttribute('style');

		// print the iframe
		printFrameCw.print();

		// destroy the iframe ... LATER
		this.printFrame = printFrame ;
	},
	
	handleQuit: function() {
		this.destroy() ;
	},
	
	onDestroy: function() {
		if( this.printFrame ) {
			this.printFrame.destroy() ;
		}
	}
});