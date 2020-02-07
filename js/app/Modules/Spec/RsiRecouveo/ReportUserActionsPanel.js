Ext.define('Optima5.Modules.Spec.RsiRecouveo.ReportUserActionsPanel',{
	extend:'Ext.panel.Panel',
	
	requires: [
		'Ext.ux.CheckColumnNull',
		'Optima5.Modules.Spec.RsiRecouveo.CfgParamButton',
		'Optima5.Modules.Spec.RsiRecouveo.SearchCombo',
		'Optima5.Modules.Spec.RsiRecouveo.CfgParamFilter',
		'Optima5.Modules.Spec.RsiRecouveo.MultiActionForm'
	],
	
	filters: {},
	autoRefreshDelay: (10*60*1000),
	defaultViewMode: 'file',
	
	initComponent: function() {
		Ext.apply(this, {
			layout: 'fit',
			items: []
		});
		this.callParent() ;
		this.tmpModelCnt = 0 ;
		
		this.buildViews() ;
	},

	buildViews: function(dataColumns=[]) {
		var countRenderer = function(v) {
			if( v != 0 ) {
				return ''+v+'' ;
			}
		}
		
		var modelFields = [
			{ name: 'user_id', type: 'string' },
			{ name: 'user_fullname', type: 'string' },
		];
		
		var map_groupId_childrenCols = {} ;
		var map_groupId_groupTxt = {} ;
		var color_inv=false ;
		Ext.Array.each( dataColumns, function(colDef) {
			modelFields.push({
				name: colDef.col_id,
				type: 'number'
			});
			
			if( !map_groupId_childrenCols.hasOwnProperty(colDef.group_id) ) {
				color_inv = !color_inv ;
				map_groupId_childrenCols[colDef.group_id] = [] ;
				map_groupId_groupTxt[colDef.group_id] = colDef.group_txt ;
			}
			map_groupId_childrenCols[colDef.group_id].push({
				tdCls: (colDef.group_sum ? 'op5-spec-rsiveo-blue' : (color_inv ? 'op5-spec-rsiveo-taupe' : '')),
				text: colDef.col_txt.replace(' ','<br>'),
				dataIndex: colDef.col_id,
				width:100,
				align: 'right',
				renderer: countRenderer,
				summaryType: 'sum'
			});
		}) ;
		
		
		var columns = [{
			text: 'Collaborateur',
			width:160,
			dataIndex: 'user_fullname',
			locked: true
		}] ;
		Ext.Object.each( map_groupId_childrenCols, function(groupId, cols) {
			columns.push({
				text: map_groupId_groupTxt[groupId],
				columns: cols
			}) ;
		}) ;
		
		columns = {
			defaults: {
				menuDisabled: false,
				draggable: false,
				sortable: true,
				hideable: false,
				resizable: true,
				groupable: false,
				lockable: false
			},
			items: columns
		}
		
		this.tmpModelName = 'RsiRecouveoReportUserActionsModel'+'-' + this.getId() + (++this.tmpModelCnt) ;
		Ext.ux.dams.ModelManager.unregister( this.tmpModelName ) ;
		Ext.define(this.tmpModelName, {
			extend: 'Ext.data.Model',
			idProperty: 'user_id',
			fields: modelFields
		});
		
		this.removeAll() ;
		this.add({
			xtype: 'grid',
			itemId: 'pGrid',
			cls: 'op5-spec-rsiveo-reportgrid',
			columns: columns,
			features: [{
				ftype: 'summary',
				dock: 'top'
			}],
			store: {
				model: this.tmpModelName,
				data: [],
				proxy: {
					type: 'memory'
				}
			}
		});
	},
	
	getFilterValues: function() {
		if( !this._dashboardPanel || !(this._dashboardPanel instanceof Optima5.Modules.Spec.RsiRecouveo.ReportFilterablePanel) ) {
			return {};
		}
		return this._dashboardPanel.getFilterValues() ;
	},
	doLoad: function(doClearFilters) {
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'report_getUserActions',
				filters: Ext.JSON.encode(this.getFilterValues()),
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					Ext.MessageBox.alert('Error','Error') ;
					return ;
				}
				this.buildViews( ajaxResponse.columns ) ;
				this.onLoad(ajaxResponse.data, doClearFilters) ;
				// Setup autoRefresh task
				//this.autoRefreshTask.delay( this.autoRefreshDelay ) ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	onLoad: function(ajaxData) {
		// grid 
		if( true ) {
			this.down('#pGrid').getStore().clearFilter() ;
			this.down('#pGrid').getStore().sort('user_fullname','ASC') ;
		}
		this.down('#pGrid').getStore().loadRawData(ajaxData) ;
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
			msg: RsiRecouveoLoadMsg.loadMsg
		}).show();
	},
	hideLoadmask: function() {
		this.un('afterrender',this.doShowLoadmask,this) ;
		if( this.loadMask ) {
			this.loadMask.destroy() ;
			this.loadMask = null ;
		}
	},
	
	
	
	handleDownload: function() {
		var gridPanel = this.down('#pGrid') ;
		
		var mapFieldString = {} ;
		Ext.Array.each( gridPanel.getStore().getModel().getFields(), function(field) {
			mapFieldString[field.getName()] = Ext.Array.contains(['string'],field.getType()) ;
		}) ;
		
		var columns = [] ;
		var columnsKeys = [] ;
		Ext.Array.each( gridPanel.headerCt.getGridColumns(), function(column) {
			if( !column.isVisible(true) ) {
				return ;
			}
			var txt = column.text.replace('<br>',' ') ;
			if( column.ownerCt.isXType('gridcolumn') ) {
				var parentColumn = column.ownerCt ;
				txt = parentColumn.text.replace('<br>',' ') + ' - ' + txt ;
			}
			columns.push({
				dataIndex: column.dataIndex,
				dataIndexString: mapFieldString[column.dataIndex],
				text: txt
			});
			columnsKeys.push( column.dataIndex ) ;
		});
		
		var data = [] ;
		gridPanel.getStore().each( function(record) {
			var recData = record.getData(true) ;
			
			var exportData = {} ;
			Ext.Array.each( columnsKeys, function(k){
				exportData[k] = recData[k] ;
			}) ;
			data.push( exportData ) ;
		}) ;
		
		var exportParams = this.optimaModule.getConfiguredAjaxParams() ;
		Ext.apply(exportParams,{
			_moduleId: 'spec_rsi_recouveo',
			_action: 'xls_create',
			columns: Ext.JSON.encode(columns),
			data: Ext.JSON.encode(data),
			exportXls: true
		}) ;
		Ext.create('Ext.ux.dams.FileDownloader',{
			renderTo: Ext.getBody(),
			requestParams: exportParams,
			requestAction: Optima5.Helper.getApplication().desktopGetBackendUrl(),
			requestMethod: 'POST'
		}) ;
	},
	
	
});
