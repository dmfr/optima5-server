Ext.define('DbsEmbramachMachFlowRowModel', {
    extend: 'Ext.data.Model',
    fields: [
        {name: '_filerecord_id', type: 'int'},
		  {name: 'delivery_id', type: 'int'},
		  {name: 'priority_code', type: 'string'},
		  {name: 'type', type: 'string'},
		  {name: 'flow', type: 'string'},
		  {name: 'shipto_code', type: 'string'},
		  {name: 'shipto_name', type: 'string'},
		  {name: 'shipto_txt', type: 'string'},
		  {name: 'feedback_txt', type: 'string'},
		  {name: 'step_warning', type: 'string'},
		  {name: 'step_code', type: 'string'},
		  {name: 'step_txt', type: 'string'},
		  {name: 'status_closed', type: 'boolean'},
		  {name: 'linecount', type: 'int'}
	]
});
Ext.define('Optima5.Modules.Spec.DbsEmbramach.MachPanel',{
	extend:'Ext.panel.Panel',
	requires: [
		'Ext.ux.chart.series.KPIGauge', 'Ext.ux.chart.axis.KPIGauge',
		'Ext.ux.grid.FiltersFeature'
	],
	
	flowCode: null,
	
	autoRefreshDelay: (5*60*1000),
	autoRefreshTask: null,
	
	initComponent: function() {
		Ext.apply(this,{
			bodyCls: 'ux-noframe-bg',
			layout: 'border',
			items: [{
				region: 'north',
				itemId: 'pBanner',
				height: 116,
				xtype: 'component',
				tpl: [
					'<div class="op5-spec-embramach-banner">',
						'<div class="op5-spec-embramach-banner-inside">',
						'<div class="op5-spec-embramach-banner-left">',
							'<div class="op5-spec-embramach-banner-logo"></div>',
							'<div class="op5-spec-embramach-banner-title">MACH</div>',
						'</div>',
						'<div class="op5-spec-embramach-banner-right">',
							'<div class="op5-spec-embramach-banner-people">Update&nbsp:&nbsp;<b><font color="red">{maj_txt}</font></b></div>',
						'</div>',
						'</div>',
						'<div class="op5-spec-embramach-banner-blue">&#160;</div>',
					'</div>'
				],
				data: {maj_txt:'-'}
			},{
				region: 'center',
				xtype: 'panel',
				layout: 'fit',
				border: false,
				itemId: 'pCenter'
			},{
				region: 'east',
				width: 175,
				layout: 'fit',
				itemId: 'pEast'
			}]
		});
		
		this.callParent() ;
		
		this.tmpModelName = 'DbsEmbramachMachFlowRowModel-' + this.getId() ;
		this.on('destroy',function(p) {
			Ext.ux.dams.ModelManager.unregister( p.tmpModelName ) ;
		}) ;
		this.on('afterrender',function(p) {
			p.getEl().down('.op5-spec-embramach-banner-right').setVisible( this.optimaModule.getSdomainRecord().get('auth_has_all') ) ;
		},this) ;
		
		this.doConfigure() ;
	},
	
	doConfigure: function() {
		this.autoRefreshTask = new Ext.util.DelayedTask( function(){
			if( this.isDestroyed ) { // private check
				return ;
			}
			this.doLoad(false) ;
		},this);
		
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_embramach',
				_action: 'mach_getGridCfg',
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
		var pCenter = this.down('#pCenter'),
			pEast = this.down('#pEast') ;
			
		var prioMap = {} ;
		Ext.Array.each( jsonResponse.data.flow_prio, function(prio) {
			prioMap[prio.prio_id] = prio ;
		}) ;
		
		var stepRenderer = function(vObj,metaData) {
			if( !vObj ) {
				return '&#160;' ;
			}
			if( !vObj.pending && !vObj.ACTUAL_dateSql ) {
				return '&#160;' ;
			}
			var dateSql ;
			if( vObj.pending ) {
				dateSql = vObj.ETA_dateSql ;
			} else {
				dateSql = vObj.ACTUAL_dateSql ;
			}
			switch( vObj.color ) {
				case 'red' :
				case 'orange' :
				case 'green' :
					metaData.tdCls += ' '+'op5-spec-dbsembramach-gridcell-'+vObj.color ;
					break ;
			}
			if( vObj.pending && !Ext.isEmpty(dateSql) ) {
				metaData.tdCls += ' '+'op5-spec-dbsembramach-gridcell-bold' ;
			} else {
				metaData.tdCls += ' '+'op5-spec-dbsembramach-gridcell-nobold' ;
			}
			if( Ext.isEmpty(dateSql) ) {
				return '&#160;' ;
			}
			dateSql = Ext.Date.format(Ext.Date.parse(dateSql,'Y-m-d H:i:s'),'d/m/Y H:i') ;
			return dateSql.replace(' ','<br>') ;
		};
		
		var pushModelfields = [] ;
		var columns = [{
			text: 'Picking',
			dataIndex: 'delivery_id',
			tdCls: 'op5-spec-dbsembramach-bigcolumn',
			width: 130,
			align: 'center',
			filter: {
				type: 'string'
			}
		},{
			text: '# lines',
			dataIndex: 'linecount',
			width: 60,
			align: 'center'
		},{
			text: 'Priority',
			dataIndex: 'priority_code',
			renderer: function(v,metaData) {
				var prioMap = this._prioMap ;
				if( prioMap.hasOwnProperty(v) ) {
					var prioData = prioMap[v] ;
					return '<font color="' + prioData.prio_color + '">' + prioData.prio_code + '</font>' ;
				}
				return '?' ;
			},
			width: 60,
			align: 'center',
			tdCls: 'op5-spec-dbsembramach-bigcolumn',
			filter: {
				type: 'op5crmbasebible',
				optimaModule: this.optimaModule,
				bibleId: 'FLOW_PRIO'
			}
		},{
			text: 'Flow',
			dataIndex: 'flow',
			width: 70,
			align: 'center',
			tdCls: 'op5-spec-dbsembramach-bigcolumn',
			filter: {
				type: 'string'
			}
		},{
			text: 'Customer',
			dataIndex: 'shipto_txt',
			width: 130,
			filter: {
				type: 'string'
			}
		},{
			text: 'Process step',
			dataIndex: 'step_code',
			width: 120,
			filter: {
				type: 'op5crmbasebible',
				optimaModule: this.optimaModule,
				bibleId: 'FLOW_STEP'
			},
			renderer: function( v, meta, record ) {
				if( record.get('step_warning') ) {
					meta.style += 'color:red; font-weight:bold;' ;
				}
				return record.get('step_txt') ;
			}
		},{
			text: 'Feedback',
			dataIndex: 'feedback_txt',
			width: 110
		}] ;
		Ext.Array.each( jsonResponse.data.flow_milestone, function(milestone) {
			pushModelfields.push({
				name: 'milestone_'+milestone.milestone_code,
				type: 'auto'
			}) ;
			columns.push({
				text: milestone.milestone_txt,
				dataIndex: 'milestone_'+milestone.milestone_code,
				renderer: stepRenderer,
				width: 90,
				align: 'center',
				filter: {
					type: 'date',
					dateFormat: 'Y-m-d'
				},
				doSort: function(state) {
						var ds = this.up('grid').store;
						var field = this.getSortParam();
						ds.sort({
							property: field,
							direction: state,
							sorterFn: function(r1, r2) {
								var o1,o2,v1,v2 ;
								o1 = r1.get(field);
								o2 = r2.get(field);
								
								if( !Ext.isEmpty(o1.ACTUAL_dateSql) ) {
									v1 = o1.ACTUAL_dateSql ;
								} else if( !Ext.isEmpty(o1.ETA_dateSql) ) {
									v1 = o1.ETA_dateSql ;
								} else {
									v1 = '' ;
								}
								if( !Ext.isEmpty(o2.ACTUAL_dateSql) ) {
									v2 = o2.ACTUAL_dateSql ;
								} else if( !Ext.isEmpty(o2.ETA_dateSql) ) {
									v2 = o2.ETA_dateSql ;
								} else {
									v2 = '' ;
								}
								
								// transform v1 and v2 here
								return v1 > v2 ? 1 : (v1 < v2 ? -1 : 0);
							}
						});
				}
			});
		}) ;
		
		Ext.define(this.tmpModelName, {
			extend: 'DbsEmbramachMachFlowRowModel',
			fields: pushModelfields
		});
		
		var columnDefaults = {
			menuDisabled: false,
			draggable: false,
			sortable: true,
			hideable: false,
			resizable: false,
			groupable: false,
			lockable: false
		} ;
		Ext.Array.each( columns, function(column) {
			Ext.applyIf( column, columnDefaults ) ;
		}) ;
		
		var tmpGridCfg = {
			border: false,
			xtype: 'grid',
			itemId: 'pGrid',
			bodyCls: 'op5-spec-dbsembramach-mach-grid',
			store: {
				model: this.tmpModelName,
				data: []
			},
			columns:columns,
			plugins: [{
				ptype: 'bufferedrenderer'
			}],
			features: [{
				ftype: 'filters',
				encode: true,
				autoReload: false,
				local: true,
				applyingState: true
			}],
			filtersUpdate: Ext.create('Ext.util.DelayedTask', this.applyFilters, this),
			viewConfig: {
				getRowClass: function(record) {
					if( record.get('status_closed') ) {
						return 'op5-spec-dbsembramach-gridcell-done' ;
					}
				},
				enableTextSelection: true
			},
			listeners: {
				filterupdate: function(filters) {
					var grid = filters.getGridPanel() ;
					grid.filtersUpdate.cancel() ;
					grid.filtersUpdate.delay(500) ;
				},
				scope: this
			},
			_prioMap: prioMap
		} ;
		
		
		var gaugesSubPanels = [] ;
		Ext.Array.each( jsonResponse.data.flow_prio, function(prio) {
			var coef = 1,
				text = '',
				modeMinutes = false ;
			if( prio.tat_hour < 2 ) {
				coef = 60 ;
				text = ' (minutes)' ;
				modeMinutes = true ;
			}
			gaugesSubPanels.push( {
				flex: 1,
				xtype:'panel',
				bodyCls: 'ux-noframe-bg',
				itemId: 'gauge_'+prio.prio_id,
				title: '&#160;',
				titleBase: '<font color="'+prio.prio_color+'">'+prio.prio_txt+'</font>' + text,
				layout: 'fit',
				items: [{
					xtype: 'chart',
					style: 'background:#fff',
					animate: {
						easing: 'elasticIn',
						duration: 500
					},
					store: {
						fields: ['value'],
						data: [{value:0}]
					},
					_modeMinutes: modeMinutes,
					insetPadding: 25,
					flex: 1,
					axes: [{
						type: 'kpigauge',
						position: 'left',
						minimum: 0,
						maximum: (prio.tat_hour * coef * 2),
						steps: Ext.Array.min([10,(prio.tat_hour * coef * 2)]),
						margin: 0,
						label: {
							fill: '#333',
							font: '12px Heveltica, sans-serif'
						}
					}],
					series: [{
						type: 'kpigauge',
						field: 'value',
						needle: {
							width: 6,
							pivotFill: prio.prio_color,
							pivotRadius: 5
						},
						ranges: [{
							from: 0,
							to: ((prio.tat_hour-0.25) * coef) ,
							color: '#2AFF00'
						}, {
							from: ((prio.tat_hour-0.25) * coef) ,
							to: (prio.tat_hour * coef),
							color: '#FFB300'
						}, {
							from: (prio.tat_hour * coef),
							to: (prio.tat_hour * coef * 2),
							color: '#FF2B2B'
						}],
						donut: 70
					}]
				}]
			} );
		}) ;
		
		var tmpGaugesCfg = {
			xtype: 'panel',
			itemId: 'pGauges',
			border: false,
			collapsible: true,
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			title: 'Performance gauges',
			items: gaugesSubPanels
		} ;
		
		
		
		
		pCenter.removeAll() ;
		pCenter.add( tmpGridCfg ) ;
		pEast.removeAll() ;
		pEast.add( tmpGaugesCfg ) ;
		this.doLoad() ;
	},
	
	doLoad: function(doReset) {
		this.autoRefreshTask.cancel() ;
		
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_embramach',
				_action: 'mach_getGridData',
				flow_code: this.flowCode
			},
			success: function(response) {
				var jsonResponse = Ext.JSON.decode(response.responseText) ;
				if( jsonResponse.success != true ) {
					return ;
				}
				this.onLoad( jsonResponse, doReset ) ;
			},
			callback: function() {
				this.hideLoadmask() ;
				
				// Setup autoRefresh task
				this.autoRefreshTask.delay( this.autoRefreshDelay ) ;
			},
			scope: this
		}) ;
	},
	onLoad: function( jsonResponse, doReset ) {
		var pGrid = this.down('#pGrid'),
			pGauges = this.down('#pGauges'),
			pBanner = this.down('#pBanner'),
			pGridStore = pGrid.getStore() ;
		if( doReset ) {
			pGridStore.sorters.clear() ;
			pGrid.filters.clearFilters() ;
		}
		
		pGridStore.loadData( jsonResponse.data_grid ) ;
		this.applyFilters() ;
		
		Ext.Object.each( jsonResponse.data_gauges, function( prioId, value ) {
			var pGauge = pGauges.down('#gauge_'+prioId) ;
			if( pGauge == null ) {
				return ;
			}
			
			if( jsonResponse.data_prioCount[prioId] ) {
				pGauge.setTitle( jsonResponse.data_prioCount[prioId] + '&#160;' + pGauge.titleBase ) ;
			} else {
				pGauge.setTitle( pGauge.titleBase ) ;
			}
			
			var cGauge = pGauge.down('chart') ;
			cGauge.getStore().loadData([{value: (cGauge._modeMinutes ? value * 60 : value)}]) ;
		}) ;
		
		pBanner.update({maj_txt: jsonResponse.maj_date}) ;
	},
	
	applyFilters: function() {
		var pGrid = this.down('#pGrid'),
			pGridStore = pGrid.getStore(),
			pGridView = pGrid.getView() ;
		
		pGridStore.clearFilter() ;
		
		
		var filterData = pGrid.filters.getFilterData() ;
		pGridStore.filterBy(function(record){
			var passed = true ;
			Ext.Array.each( filterData, function(filter) {
				switch(filter.data.type) {
					case 'list' :
						if( !Ext.Array.contains(filter.data.value,record.get(filter.field)) ) {
							passed = false ;
						}
						break ;
						
					case 'string' :
						var value = record.get(filter.field) ;
						if( !Ext.isString(value) ) {
							value = value.toString() ;
						}
						if( !value.match(new RegExp(filter.data.value, "i")) ) {
							passed = false ;
						}
						break ;
						
					case 'date' :
						var valueObj = record.get(filter.field),
							value ;
						if( !Ext.isEmpty(valueObj.ACTUAL_dateSql) ) {
							value = valueObj.ACTUAL_dateSql ;
						} else {
							value = valueObj.ETA_dateSql ;
						}
						if( !Ext.isEmpty(value) ) {
							value = value.substr(0,10) ;
						}
						switch( filter.data.comparison ) {
							case 'eq' :
								if( !(value == filter.data.value) ) {
									passed = false ;
								}
								break ;
								
							case 'gt' :
								console.log(filter.data.value + '    '  +value) ;
								if( !Ext.isEmpty(value) && !(value >= filter.data.value) ) {
									passed = false ;
								}
								break ;
								
							case 'lt' :
								if( Ext.isEmpty(value) ) {
									passed = false ;
								}
								if( !(value <= filter.data.value) ) {
									passed = false ;
								}
								break ;
						}
						break ;
				}
			}) ;
			return passed ;
		});
		
		pGridView.refresh() ;
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
		if( this.autoRefreshTask ) {
			this.autoRefreshTask.cancel() ;
		}
	}
});