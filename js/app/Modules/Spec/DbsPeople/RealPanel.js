Ext.define('DbsPeopleRhRealDaySliceModel',{
	extend: 'Ext.data.Model',
	fields: [
		{name: 'role_code', type:'string'},
		{name: 'length_hours', type:'int'},
		{name: 'whse_is_alt', type:'boolean'},
		{name: 'whse_code', type:'string'}
	]
}) ;
Ext.define('DbsPeopleRhRealDayModel', {
	extend: 'Ext.data.Model',
	fields: [
		{name: 'date_sql',  type: 'string'},
		{name: 'people_id',  type: 'string'},
		{name: 'people_name',   type: 'string'},
		{name: 'people_techid',   type: 'string'},
		{name: 'team_code',   type: 'string'},
		{name: 'whse_code',   type: 'string'},
		{name: 'whse_is_alt',   type: 'boolean'},
		{name: 'missing', type:'boolean'}
	],
	hasMany: [{
		model: 'DbsPeopleRhRealDaySliceModel',
		name: 'slices',
		associationKey: 'slices'
	}]
}) ;



Ext.define('Optima5.Modules.Spec.DbsPeople.RealPanel',{
	extend:'Ext.panel.Panel',
	
	requires:[
		'Optima5.Modules.Spec.DbsPeople.RealAdvancedPanel',
		'Optima5.Modules.Spec.DbsPeople.CfgParamSiteButton',
		'Optima5.Modules.Spec.DbsPeople.CfgParamTeamButton'
	],
	
	dateStart: null,
	dateEnd: null,
	
	remoteData: null ,
	cfgData: null,
	
	initComponent: function() {
		var me = this ;
		
		me.cellEditing = Ext.create('Ext.grid.plugin.CellEditing', {
			clicksToEdit: 1,
			listeners: {
				beforeedit: me.onGridBeforeEdit,
				edit: me.onGridAfterEdit,
				scope: me
			}
		});
		
		
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
							this.doLoad() ;
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
							this.doLoad() ;
						},
						scope: this
					}
				}
			}),'->',{
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
								{iconCls: '', text:'Conforme'},
								{iconCls: 'op5-spec-dbspeople-realcolor-role', text:'Modif. Rôle'},
								{iconCls: 'op5-spec-dbspeople-realcolor-duree', text:'Modif. Durée'},
								{iconCls: 'op5-spec-dbspeople-realcolor-absent', text:'Absence'},
								{iconCls: 'op5-spec-dbspeople-realcolor-whse', text:'Transfert'},
							]
						},
						//frame: true,
						width:100,
						height:300
					}]
				}
			}],
			items:[{
				border: false,
				xtype:'component',
				cls: 'op5-waiting'
			}]
		});
		
		this.callParent() ;
		this.startPanel() ;
	},
	startPanel: function() {
		var me = this ;
		
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_people',
				_action: 'RH_getCfgData',
				cfgParam_id: this.cfgParam_id
			},
			success: function(response) {
				var jsonResponse = Ext.decode(response.responseText) ;
				if( jsonResponse.success == false ) {
					Ext.Msg.alert('Failed', 'Failed');
				}
				else {
					this.devCfgData = jsonResponse.data ;
					
					var arr, indexedData ;
					this.cfgData = {} ;
					for( prop in jsonResponse.data ) {
						arr = jsonResponse.data[prop] ;
						indexedData = {} ;
						for( var idx = 0 ; idx < arr.length ; idx++ ) {
							indexedData[arr[idx].id] = arr[idx].text ;
						}
						this.cfgData[prop] = indexedData ;
					}
				}
			},
			scope: this
		});
		
		me.onDateSet( new Date() ) ;
		
		return ;
	},
	
	helperGetRoleTxt: function( roleCode ) {
		return this.cfgData['ROLE'][roleCode] ;
	},
	helperGetWhseTxt: function( whseCode ) {
		return this.cfgData['WHSE'][whseCode] ;
	},
	helperGetTeamTxt: function( teamCode ) {
		return this.cfgData['TEAM'][teamCode] ;
	},
	
	onDateSet: function( date ) {
		var me = this ;
		
		// configuration GRID
		var first = date.getDate() - date.getDay() + 1; // First day is the day of the month - the day of the week
		var last = first + 6; // last day is the first day + 6
		
		me.dateStart = new Date(Ext.clone(date).setDate(first));
		me.dateEnd = new Date(Ext.clone(date).setDate(last));
		
		me.doGridConfigure() ;
		me.doLoad() ;
	},
	doGridConfigure: function() {
		var me = this,
			modelName = 'RealPanel-Grid-' + me.getId(),
			dateStart = Ext.clone(me.dateStart),
			dateEnd = Ext.clone(me.dateEnd) ;
			
		if( Ext.ModelManager.getModel(modelName) != null ) {
			Ext.ModelManager.unregister(Ext.ModelManager.getModel(modelName)) ;
		}
		
		var modelFields = [
        {name: 'isWhseAlt',  type: 'boolean'},
        {name: 'rowHash',  type: 'string'},
        {name: 'whse_code',  type: 'string'},
        {name: 'whse_txt',  type: 'string'},
        {name: 'team_code',  type: 'string'},
        {name: 'team_txt',  type: 'string'},
        {name: 'people_name',   type: 'string'},
        {name: 'people_techid',   type: 'string'}
		] ;
		
		var columns = [{
			locked: true,
			text: 'Entrepôt',
			dataIndex: 'whse_txt',
			width: 180,
			groupable: true
		},{
			locked: true,
			text: 'Equipe',
			dataIndex: 'team_txt',
			width: 100,
			groupable: true
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
			var dStr = Ext.Date.format(d,'Ymd') ;
			modelFields = modelFields.concat([
				{ name:'d_'+dStr+'_roleCode', type:'string' },
				{ name:'d_'+dStr+'_lengthHours', type:'string' },
				{ name:'d_'+dStr+'_isAbs', type:'boolean' },
				{ name:'d_'+dStr+'_isWhseAlt', type:'boolean' },
				{ name:'d_'+dStr+'_altText', type:'string' }
			]) ;
			
			columns.push({
				text: Optima5.Modules.Spec.DbsPeople.HelperCache.DayNamesIntl.FR[d.getDay()] + ' ' + Ext.Date.format(d,'d/m'),
				columns: [{
					text: 'Role',
					dataIndex: 'd_'+dStr+'_roleCode',
					dateHash: 'd_'+dStr,
					width: 60,
					align: 'center',
					editor: {
						ROLE: true,
						xtype: 'combobox',
						queryMode: 'local',
						forceSelection: true,
						editable: false,
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
					renderer: function( value, metaData, record, rowIndex, colIndex ) {
						var dateHash = this.headerCt.getHeaderAtIndex(colIndex).dateHash ;
						if( record.get(dateHash+'_isAbs') == true ) {
							metaData.tdCls = 'op5-spec-dbspeople-realcolor-absent' ;
							return 'Absent' ;
						}
						if( record.get(dateHash+'_isWhseAlt') == true ) {
							metaData.tdCls = 'op5-spec-dbspeople-realcolor-whse' ;
						}
						
						return value ;
					}
				},{
					text: 'Tmp',
					dataIndex: 'd_'+dStr+'_lengthHours',
					dateHash: 'd_'+dStr,
					width:50,
					editor: {xtype: 'numberfield' },
					renderer: function( value, metaData, record, rowIndex, colIndex ) {
						var dateHash = this.headerCt.getHeaderAtIndex(colIndex).dateHash ;
						if( record.get(dateHash+'_isAbs') == true ) {
							metaData.tdCls = 'op5-spec-dbspeople-realcolor-absent' ;
							return '' ;
						}
						if( record.get(dateHash+'_isWhseAlt') == true ) {
							metaData.tdCls = 'op5-spec-dbspeople-realcolor-whse' ;
						}
						
						return value ;
					}
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
		}) ;
		
		Ext.define( modelName, {
			extend: 'Ext.data.Model',
			idProperty: 'rowHash',
			fields: modelFields
		}) ;
		
		
		me.removeAll() ;
		me.add({
			border: false,
			xtype:'grid',
			store: {
				model: modelName,
				data: [],
				proxy:{
					type:'memory'
				}
			},
			enableLocking: true,
			plugins: [{
				ptype:'cellediting',
				clicksToEdit: 1,
				listeners: {
					beforeedit: me.onGridBeforeEdit,
					edit: me.onGridAfterEdit,
					scope: me
				},
				lockableScope: 'normal'
			},{
				ptype: 'bufferedrenderer',
				lockableScope: 'both'
			}],
			features: [{
				//groupHeaderTpl: '{name}',
				ftype: 'grouping',
				hideGroupedHeader: true,
				enableGroupingMenu: false,
				enableNoGroups: false,
				groupHeaderTpl:Ext.create('Ext.XTemplate',
					'<div>{[this.renderer(values)]}</div>',
					{
						renderer: function(values) {
							if( values.rows.length == 0 ) {
								return '' ;
							}
							switch( values.columnName ) {
								case 'whse_code' :
									return values.rows[0].data.whse_txt ;
								case 'team_code' :
									return values.rows[0].data.team_txt ;
								default :
									return '' ;
							}
						}
					}
				)
			}],
			columns: columns,
			listeners: {
				itemcontextmenu: function( gridview, record, node, index, e ) {
					var cellNode = e.getTarget(gridview.cellSelector);
					
					var gridRecord = record,
						column = gridview.getHeaderByCell(cellNode),
						rowHash = gridRecord.get('rowHash'),
						dateHash = column.dateHash,
						remoteDataIdx = this.remoteDataMap[rowHash][dateHash],
						remoteDataRecord = this.remoteData[remoteDataIdx] ;
					
					me.openAdvanced( remoteDataRecord, cellNode ) ;
				},
				scope: me
			},
			viewConfig: {
				getRowClass: function(record) {
					if( record.get('isWhseAlt') ) {
						return 'op5-spec-dbspeople-realcolor-whse' ;
					}
				}
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
	
	doLoad: function() {
		this.showLoadmask() ;
		
		var filter_site = this.down('#btnSite').getNode(),
			filter_team = this.down('#btnTeam').getNode() ;
		
		var params = {
			_moduleId: 'spec_dbs_people',
			_action: 'Real_getData'
		};
		Ext.apply( params, {
			date_start: Ext.Date.format( this.dateStart, 'Y-m-d' ),
			date_end: Ext.Date.format( this.dateEnd, 'Y-m-d' )
		}) ;
		if( filter_site != null ) {
			params['filter_site_type'] = filter_site.nodeType ;
			params['filter_site_key'] = filter_site.nodeKey ;
		}
		if( filter_team != null ) {
			params['filter_team_type'] = filter_team.nodeType ;
			params['filter_team_key'] = filter_team.nodeKey ;
		}
		
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: params,
			success: this.onLoadResponse,
			scope: this
		});
	},
	onLoadResponse: function(response) {
		var me = this,
			remoteDataMap = {} ;
			
		var ajaxData = Ext.JSON.decode(response.responseText).data ;
	
		var record, dateSql, rowHash, dateHash ;
		for( var idx=0 ; idx < ajaxData.length ; idx++ ) {
			record = ajaxData[idx] ;
			dateSql = record.date_sql ;
			
			rowHash = record.whse_code + '@' + record.team_code + '@' + record.people_id ;
			dateHash = 'd_' + dateSql.substr(0,4) + dateSql.substr(5,2) + dateSql.substr(8,2) ;
			
			record['rowHash'] = rowHash ;
			record['dateHash'] = dateHash ;
			
			if( typeof remoteDataMap[rowHash] === 'undefined' ) {
				remoteDataMap[rowHash] = {} ;
			}
			remoteDataMap[rowHash][dateHash] = idx ;
		}
		me.remoteData = ajaxData ;
		me.remoteDataMap = remoteDataMap ;
		
		var grid = me.child('grid'),
			store = grid.getStore(),
			filter_site = me.down('#btnSite').getNode(),
			filter_team = me.down('#btnTeam').getNode() ;
		// inject inline data
		store.loadRawData( me.buildGridData() ) ;
		// cfg columns + groups
		grid.headerCt.down('[dataIndex="whse_txt"]').setVisible( filter_site==null ) ;
		grid.headerCt.down('[dataIndex="team_txt"]').setVisible( filter_team==null ) ;
		
		store.sort('people_name','ASC') ;
		store.clearGrouping() ;
		if( filter_site==null ) {
			store.group( 'whse_code', 'ASC' ) ;
			grid.headerCt.down('[dataIndex="whse_txt"]').setVisible( false ) ;
		} else if( filter_team==null ) {
			store.group( 'team_code', 'ASC' ) ;
			grid.headerCt.down('[dataIndex="team_txt"]').setVisible( false ) ;
		}
		
		// Drop loadmask
		this.hideLoadmask();
	},
	
	
	buildGridData: function() {
		var me = this ;
		if( me.remoteData == null ) {
			return ;
		}
		
		var obj_peopleId_objPeopleInfo = {} ;
		var obj_peopleId_objDateSlices = {} ;
		var record, rowHash, dateHash ;
		for( var idx=0 ; idx < me.remoteData.length ; idx++ ) {
			record = me.remoteData[idx] ;
			rowHash = record.rowHash ;
			dateHash = record.dateHash ;
			
			var peopleId = record.people_id ;
			if( typeof obj_peopleId_objPeopleInfo[peopleId] === 'undefined' ) {
				obj_peopleId_objPeopleInfo[peopleId] = {
					people_id: peopleId,
					people_name: record.people_name, 
					people_techid: record.people_techid
				};
			}
			
			if( typeof obj_peopleId_objDateSlices[rowHash] === 'undefined' ) {
				obj_peopleId_objDateSlices[rowHash] = {} ;
				obj_peopleId_objDateSlices[rowHash]['rowHash'] = rowHash ;
				obj_peopleId_objDateSlices[rowHash]['people_id'] = peopleId ;
				obj_peopleId_objDateSlices[rowHash]['team_code'] = record.team_code ;
				obj_peopleId_objDateSlices[rowHash]['whse_code'] = record.whse_code ;
				obj_peopleId_objDateSlices[rowHash]['isWhseAlt'] = (record.alt_whse_code == true) ;
				obj_peopleId_objDateSlices[rowHash]['columns'] = {} ;
			}
			obj_peopleId_objDateSlices[rowHash]['columns'][dateHash] = record.slices ;
		} ;
		
		var gridData = [] ;
		var gridRow, teamCode, whseCode, peopleId, peopleInfo ;
		var slices, slice, gridRoles, gridLength, isWhseAlt ;
		for( rowHash in obj_peopleId_objDateSlices ) {
			peopleId = obj_peopleId_objDateSlices[rowHash]['people_id'] ;
			teamCode = obj_peopleId_objDateSlices[rowHash]['team_code'] ;
			whseCode = obj_peopleId_objDateSlices[rowHash]['whse_code'] ;
			isWhseAlt = obj_peopleId_objDateSlices[rowHash]['isWhseAlt'] ;
			peopleInfo = obj_peopleId_objPeopleInfo[peopleId] ;
			
			gridRow = {} ;
			gridRow['rowHash'] = rowHash ;
			gridRow['isWhseAlt'] = isWhseAlt ;
			gridRow['team_code'] = teamCode ;
			gridRow['team_txt'] = this.helperGetTeamTxt( teamCode ) ;
			gridRow['whse_code'] = whseCode ;
			gridRow['whse_txt'] = this.helperGetWhseTxt( whseCode ) ;
			gridRow['people_id'] = peopleId ;
			gridRow['people_name'] = peopleInfo['people_name'] ;
			gridRow['people_techid'] = peopleInfo['people_techid'] ;
			
			for( dateHash in obj_peopleId_objDateSlices[rowHash]['columns'] ) {
				slices = obj_peopleId_objDateSlices[rowHash]['columns'][dateHash] ;
				
				gridRoles = [] ;
				gridLength = 0 ;
				isWhseAlt = false ;
				for( var idx=0 ; idx < slices.length ; idx++ ) {
					slice = slices[idx] ;
					if( slice.length_hours <= 0 ) {
						continue ;
					}
					gridLength += slice.length_hours ;
					if( slice.role_code ) {
						gridRoles.push( slice.role_code ) ;
					} else if( slice.whse_is_alt ) {
						gridRoles.push( slice.whse_code ) ;
						isWhseAlt = true ;
					}
				}
				
				var lengthKey = dateHash+'_lengthHours',
					roleKey =  dateHash+'_roleCode',
					isWhseAltKey =  dateHash+'_isWhseAlt' ;
				
				
				gridRow[roleKey] = gridRoles.join('+') ;
				gridRow[lengthKey] = gridLength ;
				gridRow[isWhseAltKey] = isWhseAlt ;
			}
			
			gridData.push(gridRow) ;
		}

		return gridData ;
	},
	
	onGridBeforeEdit: function( editor, editEvent ) {
		var gridRecord = editEvent.record,
			column = editEvent.column,
			colIdx = editEvent.colIdx,
			rowHash = gridRecord.get('rowHash'),
			dateHash = column.dateHash,
			remoteDataIdx = this.remoteDataMap[rowHash][dateHash],
			remoteDataRecord = this.remoteData[remoteDataIdx] ;
		
		if( remoteDataRecord.slices.length != 1 || remoteDataRecord.slices[0].whse_is_alt ) {
			var cellNode = Ext.DomQuery.select( '.x-grid-cell', editEvent.row )[colIdx] ;
			console.dir(cellNode) ;
			this.openAdvanced( remoteDataRecord, cellNode ) ;
			return false ;
		}
		
		var editorField = editEvent.column.getEditor() ;
		console.dir( editorField ) ;
		if( editorField && editorField.ROLE ) {
			editorField.getStore().loadData( this.devCfgData.ROLE ) ;
			editorField.on('select',function() {
				editor.completeEdit() ;
			},this,{single:true});
		}
	},
	onGridAfterEdit: function( editor, editEvent ) {
		var gridRecord = editEvent.record,
			column = editEvent.column,
			rowHash = gridRecord.get('rowHash'),
			dateHash = column.dateHash,
			remoteDataIdx = this.remoteDataMap[rowHash][dateHash],
			remoteDataRecord = this.remoteData[remoteDataIdx] ;
			
		var lengthKey = dateHash+'_lengthHours',
			roleKey =  dateHash+'_roleCode' ;
		
		// Store back slice into remoteData
		remoteDataRecord.slices = [{
			role_code: gridRecord.get(roleKey),
			length_hours: gridRecord.get(lengthKey)
		}] ;
			
		console.dir(remoteDataRecord) ;
	},
	
	openAdvanced: function( remoteDataRecord, htmlNode ) {
		var me = this ;
		
		var realAdvancedPanel = Ext.create('Optima5.Modules.Spec.DbsPeople.RealAdvancedPanel',{
			parentRealPanel: me,
			remoteDataRecord: remoteDataRecord,
			width:800, // dummy initial size, for border layout to work
			height:600, // ...
			floating: true,
			renderTo: me.getEl(),
			tools: [{
				type: 'close',
				handler: function(e, t, p) {
					p.ownerCt.doSave() ;
					if( p.ownerCt.remoteDataRecord ) {
						var remoteDataRecord = p.ownerCt.remoteDataRecord ;
						var slices = remoteDataRecord.slices ;
						
						var rowHash = remoteDataRecord.rowHash ;
						var dateHash = remoteDataRecord.dateHash ;
						
						var gridRoles = [] ;
						var gridLength = 0 ;
						var isWhseAlt = false ;
						for( var idx=0 ; idx < slices.length ; idx++ ) {
							slice = slices[idx] ;
							if( slice.length_hours <= 0 ) {
								continue ;
							}
							gridLength += slice.length_hours ;
							if( slice.role_code ) {
								gridRoles.push( slice.role_code ) ;
							} else if( slice.whse_is_alt ) {
								gridRoles.push( slice.whse_code ) ;
								isWhseAlt = true ;
							}
						}
						
						var lengthKey = dateHash+'_lengthHours',
							roleKey =  dateHash+'_roleCode',
							isAbsKey =  dateHash+'_isAbs',
							isWhseAltKey =  dateHash+'_isWhseAlt' ;
							
						var updateObj = {} ;
						updateObj[roleKey] = gridRoles.join('+') ;
						updateObj[lengthKey] = gridLength ;
						updateObj[isAbsKey] = remoteDataRecord.missing ;
						updateObj[isWhseAltKey] = isWhseAlt ;
						console.dir(updateObj) ;
						
						me.child('grid').getStore().getById(rowHash).set(updateObj) ;
					}
					p.ownerCt.destroy();
				}
			}]
		});
		
		// Size + position
		realAdvancedPanel.setSize({
			width: 300,
			height: 250
		}) ;
		realAdvancedPanel.on('destroy',function() {
			me.getEl().unmask() ;
			// me.fireEvent('qbookztemplatechange') ;
		},me,{single:true}) ;
		me.getEl().mask() ;
		
		realAdvancedPanel.show();
		realAdvancedPanel.getEl().alignTo(htmlNode, 'c-t?',[0,50]);
	},
	
	handleQuit: function() {
		this.destroy() ;
	}
});