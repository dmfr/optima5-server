Ext.define('DbsEmbramachReportRowModel', {
	extend: 'Ext.data.Model',
	fields: [
		{name: 'row_color', type:'string'},
		{name: 'prio_id', type:'string'},
		{name: 'prio_txt',  type: 'string'},
		{name: 'tat_code', type:'string'},
		{name: 'tat_name',  type: 'string'}
	]
});

Ext.define('Optima5.Modules.Spec.DbsEmbramach.ReportPanel',{
	extend:'Ext.panel.Panel',
	requires: [],
	
	initComponent: function() {
		Ext.apply(this,{
			layout: 'fit',
			border: false,
			items: [{
				xtype:'box',
				cls:'op5-waiting',
				flex:1
			}],
			tbar:[{
				hidden: this.noDestroy,
				icon: 'images/op5img/ico_back_16.gif',
				text: '<u>Retour menu</u>',
				handler: function(){
					this.doQuit() ;
				},
				scope: this
			},{
				iconCls: 'op5-crmbase-datatoolbar-refresh',
				text: 'Refresh',
				handler: function() {
					this.doRefresh() ;
				},
				scope: this
			}]
		});
		
		this.callParent() ;
		
		this.tmpModelName = 'DbsEmbramachReportRowModel-' + this.getId() ;
		this.on('destroy',function(p) {
			Ext.ux.dams.ModelManager.unregister( p.tmpModelName ) ;
		}) ;
		
		this.doConfigure() ;
	},
	
	doConfigure: function() {
		//this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_embramach',
				_action: 'stats_getPicking',
				flow_code: this.flowCode
			},
			success: function(response) {
				var jsonResponse = Ext.JSON.decode(response.responseText) ;
				if( jsonResponse.success != true ) {
					return ;
				}
				this.onConfigure( jsonResponse ) ;
			},
			callback: function() {
				//this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	onConfigure: function( jsonResponse ) {
		console.dir(jsonResponse) ;
		
		var cssBlob = '',
			colors = [] ;
		Ext.Array.each( jsonResponse.cfg.tat, function(cfgTat) {
			cssRoot = '.color-'+cfgTat.color.substr(1,6) ;
			cssBlob += cssRoot+" .x-grid-cell-inner { background-color:"+cfgTat.color+" }\r\n" ;
		}) ;
		console.log(cssBlob) ;
		Ext.util.CSS.createStyleSheet(cssBlob, 'op5specdbsembralamcolors-'+this.getId());
		
		// create Model + Grid
		var pushModelfields = [] ;
		var columns = [{
			locked: true,
			hidden: true,
			text: 'Priority',
			dataIndex: 'prio_id',
			width: 10
		},{
			locked: true,
			text: 'Tat interval',
			dataIndex: 'tat_name',
			width: 200,
			renderer: function(v) {
				return '<b>'+v+'</b>' ;
			},
			summaryType: 'count',
			summaryRenderer: function(v) {
				return 'Total heures :' ;
			}
		}] ;
		
		Ext.Array.each( jsonResponse.cfg.date, function(cfgDate) {
			var objDate = Ext.Date.parse(cfgDate.date_start,'Y-m-d') ;
				dStr = Ext.Date.format(objDate,'Ymd'),
				dSql = Ext.Date.format(objDate,'Y-m-d');
				
			var childColumns = [] ;
			Ext.Array.each( jsonResponse.cfg.shift, function(cfgShift) {
				childColumns.push({
					text: 'shift : <b>'+cfgShift.shift_txt+'</b>',
					align: 'center',
					_dateSql: dSql,
					_dateStr: dStr,
					_shiftId: cfgShift.shift_id,
					menuDisabled: true,
					columns: [{
						text: 'Nb',
						dataIndex: 'd_'+dStr,
						menuDisabled: true,
						_dateSql: dSql,
						_dateStr: dStr,
						_shiftId: cfgShift.shift_id,
						_modePercent: false,
						width: 60,
						align: 'center'
					},{
						text: '%',
						dataIndex: 'd_'+dStr,
						menuDisabled: true,
						_dateSql: dSql,
						_dateStr: dStr,
						_shiftId: cfgShift.shift_id,
						_modePercent: true,
						width: 60,
						align: 'center'
					}]
				}) ;
			});
			childColumns.push({
				text: '<b>All day</b>',
				align: 'center',
				_dateSql: dSql,
				_dateStr: dStr,
				menuDisabled: true,
				columns: [{
					text: 'Nb',
					dataIndex: 'd_'+dStr,
					menuDisabled: true,
					_dateSql: dSql,
					_dateStr: dStr,
					_shiftId: null,
					_modePercent: false,
					width: 60,
					align: 'center'
				},{
					text: '%',
					dataIndex: 'd_'+dStr,
					menuDisabled: true,
					_dateSql: dSql,
					_dateStr: dStr,
					_shiftId: null,
					_modePercent: true,
					width: 60,
					align: 'center'
				}]
			}) ;
			
			columns.push({
				text: '<b>'+Ext.Date.format(objDate,'l') + ' ' + Ext.Date.format(objDate,'d/m')+'</b>',
				_dateSql: dSql,
				_dateStr: dStr,
				menuDisabled: true,
				columns: childColumns
			});
		});
		
		
		
		
		
		Ext.ux.dams.ModelManager.unregister( this.tmpModelName ) ;
		Ext.define(this.tmpModelName, {
			extend: 'DbsEmbramachReportRowModel',
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
		
		
		
		
		
		this.removeAll() ;
		this.add({
			border: false,
			xtype:'grid',
			store: {
				model: this.tmpModelName,
				data: [],
				groupField: 'prio_id',
				proxy:{
					type:'memory'
				}
			},
			enableLocking: true,
			plugins: [],
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
								case 'prio_id' :
									return values.rows[0].data.prio_txt ;
								default :
									return '' ;
							}
						}
					}
				)
			}],
			columns: columns,
			listeners: {},
			viewConfig: {
				preserveScrollOnRefresh: true,
				getRowClass: function(record, index, rowParams, ds) {
					return 'color-'+record.get('row_color').substr(1,6) ;
				}
			}
		}) ;
		
		// forward
		this.onLoad(jsonResponse) ;
	},
	doLoad: function() {
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_embramach',
				_action: 'stats_getPicking',
				flow_code: this.flowCode
			},
			success: function(response) {
				var jsonResponse = Ext.JSON.decode(response.responseText) ;
				if( jsonResponse.success != true ) {
					return ;
				}
				this.onLoad( jsonResponse ) ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	onLoad: function( jsonResponse ) {
		// create Records
		var data = [] ;
		Ext.Array.each( jsonResponse.cfg.priority, function( cfgPriority ) {
			Ext.Array.each( jsonResponse.cfg.tat, function( cfgTat ) {
				if( cfgTat.prio_id != cfgPriority.prio_id ) {
					return ;
				}
				data.push({
					prio_id: cfgPriority.prio_id,
					prio_txt: cfgPriority.prio_txt,
					tat_code: cfgTat.tat_code,
					tat_name: cfgTat.tat_name,
					row_color: cfgTat.color
				});
			});
		});
		
		this.down('grid').getStore().loadData(data) ;
	},
	
	
	
	
	doQuit: function() {
		this.destroy() ;
	},
	doRefresh: function() {
		this.doLoad(true) ;
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
	
	onDestroy: function() {
		
	}
});