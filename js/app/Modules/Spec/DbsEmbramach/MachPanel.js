Ext.define('DbsEmbramachMachFlowRowModel', {
    extend: 'Ext.data.Model',
    fields: [
        {name: '_filerecord_id', type: 'int'},
		  {name: 'priority_code', type: 'string'},
		  {name: 'feedback_txt', type: 'string'},
		  {name: 'step_warning', type: 'string'},
		  {name: 'step_code', type: 'string'},
		  {name: 'step_txt', type: 'string'},
		  {name: 'status_closed', type: 'boolean'}
	]
});
Ext.define('Optima5.Modules.Spec.DbsEmbramach.MachPanel',{
	extend:'Ext.panel.Panel',
	requires: [
		'Ext.ux.chart.series.KPIGauge', 'Ext.ux.chart.axis.KPIGauge',
		'Ext.ux.grid.filters.filter.StringList'
	],
	
	flowCode: null,
	
	_popupMode: false,
	_popupFilters: null,
	
	autoRefreshDelay: (5*60*1000),
	autoRefreshTask: null,
	
	initComponent: function() {
		Ext.apply(this,{
			bodyCls: 'ux-noframe-bg',
			layout: 'border',
			items: [{
				hidden: this._popupMode,
				region: 'north',
				itemId: 'pBanner',
				height: 116,
				xtype: 'component',
				tpl: [
					'<div class="op5-spec-embramach-banner">',
						'<div class="op5-spec-embramach-banner-inside">',
						'<div class="op5-spec-embramach-banner-left">',
							'<div class="op5-spec-embramach-banner-logo"></div>',
							'<div class="op5-spec-embramach-banner-title">MACH<tpl if="flow_text">&#160;/&#160;{flow_text}</tpl></div>',
						'</div>',
						'<div class="op5-spec-embramach-banner-right">',
							'<div class="op5-spec-embramach-banner-people">Update&nbsp:&nbsp;<b><font color="red">{maj_txt}</font></b></div>',
						'</div>',
						'</div>',
						'<div class="op5-spec-embramach-banner-blue">&#160;</div>',
					'</div>'
				],
				data: {flow_text:null, maj_txt:'-'}
			},{
				region: 'center',
				xtype: 'panel',
				layout: 'fit',
				border: false,
				itemId: 'pCenter'
			},{
				hidden: this._popupMode,
				region: 'east',
				width: 175,
				layout: 'fit',
				itemId: 'pEast'
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
			},'->',{
				hidden: !Optima5.Modules.Spec.DbsEmbramach.HelperCache.authHelperHasAll(),
				itemId: 'tbUpload',
				iconCls: 'op5-spec-mrfoxy-promorow-action-icon-attachments',
				text: '<b>Upload Document</b>',
				menu: [{
					xtype: 'form',
					frame: true,
					defaults: {
							anchor: '100%',
							allowBlank: false,
							msgTarget: 'side',
							labelWidth: 50
					},
					dockedItems: [{
						xtype: 'toolbar',
						dock: 'bottom',
						ui: 'footer',
						defaults: {minWidth: 100},
						items: [
							{ xtype: 'component', flex: 1 },
							{ xtype: 'button', text: 'Upload' , handler:this.doUpload, scope:this }
						]
					}],
					items: [{
						xtype: 'combobox',
						name: 'file_model',
						fieldLabel: 'Model',
						forceSelection: true,
						allowBlank: false,
						editable: false,
						store: {
							fields: ['id'],
							data: [
								{id: 'VL06F_active'},
								{id: 'VL06F_closed'},
								{id: 'ZLORSD015'},
								{id: 'Z080x'}
							]
						},
						valueField: 'id',
						displayField: 'id'
					},{
						xtype: 'filefield',
						width: 450,
						emptyText: 'Select a file',
						fieldLabel: 'Source',
						name: 'file_upload',
						buttonText: '',
						buttonConfig: {
							iconCls: 'upload-icon'
						}
					}]
				}]
			},{
				itemId: 'xlsExport',
				text: 'Export XLS',
				icon: 'images/op5img/ico_save_16.gif',
				handler: function() {
					this.doDownload() ;
				},
				scope: this
			},{
				icon: 'images/op5img/ico_info_small.gif',
				text: 'Légende',
				menuAlign: 'tr-br?',
				menu: {
					xtype:'menu',
					items:[{
						xtype:'dataview',
						cls: 'op5-spec-dbsembramach-colorinfo',
						tpl: new Ext.XTemplate(
							'<tpl for=".">',
								'<div class="op5-spec-dbsembramach-colorinfo-item">',
									'{text}',
									'<div class="op5-spec-dbsembramach-colorinfo-item-icon {iconCls}"></div>',
								'</div>',
							'</tpl>'
						),
						itemSelector: 'div.op5-spec-dbsembramach-colorinfo-item',
						store: {
							fields: ['iconCls', 'text'],
							data:[
								{iconCls: 'op5-spec-dbsembramach-gridcell-green-legend', text:'On-time'},
								{iconCls: 'op5-spec-dbsembramach-gridcell-orange-legend', text:'On-time, imminent ETA'},
								{iconCls: 'op5-spec-dbsembramach-gridcell-red-legend', text:'Late'},
								{iconCls: 'op5-spec-dbsembramach-gridcell-bold-legend', text:'Current step'}
							]
						},
						//frame: true,
						width:200,
						height:200
					}]
				}
			}]
		});
		
		if( this._readonlyMode ) {
			Ext.apply( this,{
				tbar:[{
					hidden: this.noDestroy,
					icon: 'images/op5img/ico_back_16.gif',
					text: '<u>Retour menu</u>',
					handler: function(){
						this.doQuit() ;
					},
					scope: this
				},{
					icon: 'images/op5img/ico_info_small.gif',
					text: 'Légende',
					menuAlign: 'tr-br?',
					menu: {
						xtype:'menu',
						items:[{
							xtype:'dataview',
							cls: 'op5-spec-dbsembramach-colorinfo',
							tpl: new Ext.XTemplate(
								'<tpl for=".">',
									'<div class="op5-spec-dbsembramach-colorinfo-item">',
										'{text}',
										'<div class="op5-spec-dbsembramach-colorinfo-item-icon {iconCls}"></div>',
									'</div>',
								'</tpl>'
							),
							itemSelector: 'div.op5-spec-dbsembramach-colorinfo-item',
							store: {
								fields: ['iconCls', 'text'],
								data:[
									{iconCls: 'op5-spec-dbsembramach-gridcell-green-legend', text:'On-time'},
									{iconCls: 'op5-spec-dbsembramach-gridcell-orange-legend', text:'On-time, imminent ETA'},
									{iconCls: 'op5-spec-dbsembramach-gridcell-red-legend', text:'Late'},
									{iconCls: 'op5-spec-dbsembramach-gridcell-bold-legend', text:'Current step'}
								]
							},
							//frame: true,
							width:200,
							height:200
						}]
					}
				}]
			}) ;
		}
		
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
		var columns = [] ;
		
		Ext.Array.each( jsonResponse.data.fields, function(fieldCfg, fieldIdx) {
			var dataIndex = 'field_'+fieldIdx ;
			var filter, renderer ;
			if( fieldCfg.filter ) {
				switch( fieldCfg.filter.type ) {
					case 'bible' :
						filter = {
							type: 'op5crmbasebible',
							optimaModule: this.optimaModule,
							bibleId: fieldCfg.filter.bible_code
						} ;
						break ;
					default :
						filter = {
							type: fieldCfg.filter.type
						} ;
						break ;
				}
			}
			if( fieldCfg.renderer ) {
				switch( fieldCfg.renderer ) {
					case 'priority' :
						renderer = function(v,metaData) {
							var prioMap = this._prioMap ;
							if( prioMap.hasOwnProperty(v) ) {
								var prioData = prioMap[v] ;
								return '<font color="' + prioData.prio_color + '">' + prioData.prio_code + '</font>' ;
							}
							return '?' ;
						} ;
						break ;
					default :
						break ;
				}
			}
			columns.push({
				dataIndex: dataIndex,
				text: fieldCfg.text,
				width: fieldCfg.width,
				align: 'center',
				tdCls: (fieldCfg.widthBig ? 'op5-spec-dbsembramach-bigcolumn' : ''),
				filter: filter,
				renderer: renderer
			}) ;
			
			pushModelfields.push({
				name: dataIndex,
				type: (!Ext.isEmpty(fieldCfg.type) ? fieldCfg.type : 'auto')
			}) ;
		},this) ;
		
		columns.push({
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
			hidden: this._readonlyMode,
			text: 'Feedback',
			dataIndex: 'feedback_txt',
			width: 110,
			editor: {
				xtype: 'textareafield',
				grow: true,
				growMin: 30,
				growMax: 40
			}
		}) ;
		
		var sortTypeFn = function(o1) {
			var v1 = '' ;
			if( o1 ) {
				if( !Ext.isEmpty(o1.ACTUAL_dateSql) ) {
					v1 = o1.ACTUAL_dateSql ;
				} else if( !Ext.isEmpty(o1.ETA_dateSql) ) {
					v1 = o1.ETA_dateSql ;
				} else {
					v1 = '' ;
				}
			}
			return v1 ;
		};
		Ext.Array.each( jsonResponse.data.flow_milestone, function(milestone) {
			pushModelfields.push({
				name: 'milestone_'+milestone.milestone_code,
				type: 'auto',
				sortType: sortTypeFn
			}) ;
			columns.push({
				text: milestone.milestone_txt,
				dataIndex: 'milestone_'+milestone.milestone_code,
				renderer: stepRenderer,
				width: 90,
				align: 'center',
				filter: {
					type: 'date',
					dateFormat: 'Y-m-d',
					convertDateOnly: function(o1) {
						// HACK : overridding private method
						var v1 ;
						if( Ext.isDate(o1) ) {
							v1 = o1 ;
						} else if( Ext.isObject(o1) ) {
							if( !Ext.isEmpty(o1.ACTUAL_dateSql) ) {
								v1 = o1.ACTUAL_dateSql ;
							} else if( !Ext.isEmpty(o1.ETA_dateSql) ) {
								v1 = o1.ETA_dateSql ;
							} else {
								v1 = null ;
							}
						}
						var result = null;
						if (v1) {
							var v2 = new Date(v1) ;
							v2.setHours(0,0,0,0) ;
							result = v2.getTime();
						}
						return result;
					}
				}
			});
		}) ;
		
		Ext.define(this.tmpModelName, {
			extend: 'DbsEmbramachMachFlowRowModel',
			fields: pushModelfields
		});
		
		var columnDefaults = {
			menuDisabled: (this._popupMode || this._readonlyMode ? true : false),
			draggable: false,
			sortable: (this._readonlyMode ? false : true),
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
			columns: columns,
			plugins: [{
				ptype: 'uxgridfilters'
			}],
			viewConfig: {
				getRowClass: function(record) {
					if( record.get('status_closed') ) {
						return 'op5-spec-dbsembramach-gridcell-done' ;
					}
				},
				enableTextSelection: true
			},
			_prioMap: prioMap
		} ;
		if( !this._readonlyMode ) {
			tmpGridCfg.plugins.push({
				ptype: 'cellediting',
				clicksToEdit: 1,
				listeners: {
					beforeedit: this.onGridBeforeEdit,
					edit: this.onGridAfterEdit,
					scope: this
				}
			}) ;
		}
		
		
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
		
		Ext.Array.each( this.down('#pGrid').getColumns(), function(column) {
			if( column.filter && column.filter.type == 'stringlist' && !column.filter.active ) {
				column.filter.resetList() ; // HACK!
			}
		}) ;
		
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_embramach',
				_action: 'mach_getGridData',
				flow_code: this.flowCode,
				filters: ( this._popupMode ? Ext.JSON.encode(this._popupFilters) : null )
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
			pGridStore.clearFilter() ;
			pGrid.filters.clearFilters() ;
		}
		
		pGridStore.loadData( jsonResponse.data_grid ) ;
		
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
		
		pBanner.update({
			flow_text: jsonResponse.flow_text,
			maj_txt: jsonResponse.maj_date
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
	
	onGridBeforeEdit: function( editor, editEvent ) {},
	onGridAfterEdit: function( editor, editEvent ) {
		this.remoteSaveRecord( editEvent.record ) ;
	},
	
	remoteSaveRecord: function( gridRecord ) {
		var ajaxParams = {
			_moduleId: 'spec_dbs_embramach',
			_action: 'mach_saveGridRow',
			flow_code: this.flowCode,
			data: Ext.JSON.encode( gridRecord.getData(true) )
		};
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams,
			success: function(response) {},
			scope: this
		}) ;
	},
	
	
	doQuit: function() {
		if( !this.noDestroy ) {
			this.destroy() ;
		}
	},
	doRefresh: function() {
		this.doLoad(true) ;
	},
	doUpload: function( dummyfield ) {
		var me = this ;
		var msg = function(title, msg) {
			Ext.Msg.show({
					title: title,
					msg: msg,
					minWidth: 200,
					modal: true,
					icon: Ext.Msg.INFO,
					buttons: Ext.Msg.OK
			});
		};
		var uploadform = this.down('toolbar').down('form') ;
		var fileuploadfield = uploadform.query('> filefield')[0] ;
		var baseForm = uploadform.getForm() ;
		if(baseForm.isValid()){
			var ajaxParams = me.optimaModule.getConfiguredAjaxParams() ;
			Ext.apply( ajaxParams, {
				_moduleId: 'spec_dbs_embramach',
				_action: 'mach_upload'
			}) ;
			
			var msgbox = Ext.Msg.wait('Uploading source...');
			baseForm.submit({
				url: Optima5.Helper.getApplication().desktopGetBackendUrl(),
				params: ajaxParams,
				success : function(form,action){
					msgbox.close() ;
					Ext.menu.Manager.hideAll();
					var ajaxData = Ext.JSON.decode(action.response.responseText).data ;
					this.doRefresh() ;
				},
				failure: function(fp, o) {
					msgbox.close() ;
					msg('Pouet','Error during upload') ;	
				},
				scope: me
			});
		}
	},
	
	doDownload: function() {
		var me = this ;
		
		var exportParams = me.optimaModule.getConfiguredAjaxParams() ;
		Ext.apply(exportParams,{
			_moduleId: 'spec_dbs_embramach',
			_action: 'mach_getGridXls',
			flow_code: this.flowCode
		}) ;
		Ext.create('Ext.ux.dams.FileDownloader',{
			renderTo: Ext.getBody(),
			requestParams: exportParams,
			requestAction: Optima5.Helper.getApplication().desktopGetBackendUrl(),
			requestMethod: 'POST'
		}) ;
	},
	
	
	
	onDestroy: function() {
		if( this.autoRefreshTask ) {
			this.autoRefreshTask.cancel() ;
		}
	}
});