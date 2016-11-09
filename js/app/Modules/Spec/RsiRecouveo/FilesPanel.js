Ext.define('Optima5.Modules.Spec.RsiRecouveo.FilesPanel',{
	extend:'Ext.panel.Panel',
	
	requires: [
		'Ext.ux.CheckColumnNull',
		'Optima5.Modules.Spec.RsiRecouveo.CfgParamButton',
		'Optima5.Modules.Spec.RsiRecouveo.CfgParamFilter'
	],
	
	viewMode: null,
	autoRefreshDelay: (10*60*1000),
	
	initComponent: function() {
		Ext.apply(this, {
			layout: 'border',
			tbar:[{
				hidden: this._readonlyMode,
				icon: 'images/op5img/ico_back_16.gif',
				text: '<u>Back</u>',
				handler: function(){
					this.doQuit() ;
				},
				scope: this
			},'-',Ext.create('Optima5.Modules.Spec.RsiRecouveo.CfgParamButton',{
				cfgParam_id: 'ATR_BU',
				icon: 'images/op5img/ico_blocs_small.gif',
				itemId: 'btnBu',
				optimaModule: this.optimaModule,
				listeners: {
					change: {
						fn: function() {
							//this.onSocSet() ;
						},
						scope: this
					},
					ready: {
						fn: function() {
							
						},
						scope: this
					}
				}
			}),'-',Ext.create('Optima5.Modules.Spec.RsiRecouveo.CfgParamButton',{
				cfgParam_id: 'ATR_DIV',
				icon: 'images/op5img/ico_blocs_small.gif',
				itemId: 'btnDiv',
				optimaModule: this.optimaModule,
				listeners: {
					change: {
						fn: function() {
							//this.onSocSet() ;
						},
						scope: this
					},
					ready: {
						fn: function() {
							
						},
						scope: this
					}
				}
			}),'-',Ext.create('Optima5.Modules.Spec.RsiRecouveo.CfgParamButton',{
				cfgParam_id: 'ATR_SECT',
				icon: 'images/op5img/ico_blocs_small.gif',
				itemId: 'btnSect',
				optimaModule: this.optimaModule,
				listeners: {
					change: {
						fn: function() {
							//this.onSocSet() ;
						},
						scope: this
					},
					ready: {
						fn: function() {
							
						},
						scope: this
					}
				}
			}),'->',{
				hidden: this._readonlyMode,
				iconCls: 'op5-crmbase-datatoolbar-file-export-excel',
				text: 'Export',
				handler: function() {
					this.handleDownload() ;
				},
				scope: this
			}],
			items: [{
				title: 'Statistiques sur sélection',
				region: 'north',
				//hidden: true,
				collapsible: true,
				height: 240,
				border: true,
				xtype: 'panel',
				itemId: 'pNorth',
				layout: {
					type: 'hbox',
					align: 'stretch'
				},
				items: []
			},{
				region: 'center',
				flex: 1,
				border: false,
				xtype: 'panel',
				itemId: 'pCenter',
				layout: {
					type: 'fit'
				},
				items: []
			}]
		});
		this.callParent() ;
		this.mon(this.optimaModule,'op5broadcast',this.onCrmeventBroadcast,this) ;
		this.on('beforedeactivate', function() {
			// HACK !!!
			return ;
			if( this.down('gridpanel').getStore().loading || this.down('gridpanel').getView().isRefreshing ) {
				return false ;
			}
		},this) ;
		
		this.tmpModelCnt = 0 ;
		
		//this.onViewSet(this.defaultViewMode) ;
		this.configureViews() ;
	},
	onCrmeventBroadcast: function(crmEvent, eventParams) {
		switch( crmEvent ) {
			case 'datachange' :
				this.onDataChange() ;
				break ;
			default: break ;
		}
	},
	onDataChange: function() {
		this.doLoad() ;
	},
	
	configureViews: function() {
		var pNorth = this.down('#pNorth') ;
		pNorth.add({
			xtype: 'panel',
			cls: 'chart-no-border',
			width: 350,
			layout: 'fit',
			border: false,
			items: {
				xtype: 'polar',
				border: false,
				store: { 
					fields: ['os', 'data1' ],
					data: [
						{ os: 'Android', data1: 68.3 },
						{ os: 'BlackBerry', data1: 1.7 },
						{ os: 'iOS', data1: 17.9 },
						{ os: 'Windows Phone', data1: 10.2 },
						{ os: 'Others', data1: 1.9 }
					]
				},
				insetPadding: { top: 10, left: 10, right: 10, bottom: 20 },
				//innerPadding: 20,
				legend: {
					docked: 'left',
					border: false,
					toggleable: false,
					style: {
						border: {
							color: 'white'
						}
					}
				},
				interactions: ['itemhighlight'],
            sprites: [{
					type: 'text',
					text: 'Répartition K€',
					fontSize: 12,
					width: 100,
					height: 30,
					x: 55, // the sprite x position
					y: 205  // the sprite y position
				}],
				series: [{
					type: 'pie',
					angleField: 'data1',
					donut: 50,
					label: {
						field: 'os',
						calloutLine: {
							color: 'rgba(0,0,0,0)' // Transparent to hide callout line
						},
						renderer: function(val) {
							return ''; // Empty label to hide text
						}
					},
					highlight: true,
					tooltip: {
						trackMouse: true,
						style: 'background: #fff',
						renderer: function(storeItem, item) {
							this.setHtml(storeItem.get('os') + ': ' + storeItem.get('data1') + '%');
						}
					}
				}]
			}
		}) ;
		pNorth.add({
			xtype: 'panel',
			width: 215,
			layout: 'fit',
			border: false,
			items: {
				xtype: 'polar',
				border: false,
				store: { 
					fields: ['os', 'data1' ],
					data: [
						{ os: 'Android', data1: 68.3 },
						{ os: 'BlackBerry', data1: 1.7 },
						{ os: 'iOS', data1: 17.9 },
						{ os: 'Windows Phone', data1: 10.2 },
						{ os: 'Others', data1: 1.9 }
					]
				},
				insetPadding: { top: 10, left: 10, right: 10, bottom: 20 },
				//innerPadding: 20,
				interactions: ['itemhighlight'],
            sprites: [{
					type: 'text',
					text: 'Nb Dossiers',
					fontSize: 12,
					width: 100,
					height: 30,
					x: 65, // the sprite x position
					y: 205  // the sprite y position
				}],
				series: [{
					type: 'pie',
					angleField: 'data1',
					donut: 50,
					label: {
						field: 'os',
						calloutLine: {
							color: 'rgba(0,0,0,0)' // Transparent to hide callout line
						},
						renderer: function(val) {
							return ''; // Empty label to hide text
						}
					},
					highlight: true,
					tooltip: {
						trackMouse: true,
						style: 'background: #fff',
						renderer: function(storeItem, item) {
							this.setHtml(storeItem.get('os') + ': ' + storeItem.get('data1') + '%');
						}
					}
				}]
			}
		}) ;
		pNorth.add({
			xtype: 'panel',
			border: false,
			cls: 'chart-no-border',
			flex: 1,
			layout: 'fit',
			//border: false,
			items: {
            xtype: 'cartesian',
				border: false,
            width: '100%',
            height: '100%',
            legend: {
                docked: 'bottom'
            },
            store: {
					fields: ['month', 'data1', 'data2', 'data3', 'data4', 'other'],
					data: [
						{ month: 'Contacts', data1: 20, data2: 37, data3: 35, data4: 4, other: 4 },
						{ month: 'RDV', data1: 20, data2: 37, data3: 35, data4: 4, other: 4 },
						{ month: 'Promesses', data1: 20, data2: 37, data3: 35, data4: 4, other: 4 },
					]
				},
            insetPadding: { top: 30, left: 10, right: 30, bottom: 10 },
            flipXY: true,
            sprites: [{
                type: 'text',
                text: 'Agenda / Actions imminentes',
                fontSize: 14,
                width: 100,
                height: 30,
                x: 150, // the sprite x position
                y: 20  // the sprite y position
            }],
            axes: [{
                type: 'numeric',
                position: 'bottom',
                adjustByMajorUnit: true,
                fields: 'data1',
                grid: true,
                renderer: function (v) { return v + '%'; },
                minimum: 0
            }, {
                type: 'category',
                position: 'left',
                fields: 'month',
                grid: true
            }],
            series: [{
                type: 'bar',
                axis: 'bottom',
                title: [ 'IE', 'Firefox', 'Chrome', 'Safari' ],
                xField: 'month',
                yField: [ 'data1', 'data2', 'data3', 'data4' ],
                stacked: true,
                style: {
                    opacity: 0.80
                },
                highlight: {
                    fillStyle: 'yellow'
                },
                tooltip: {
                    trackMouse: true,
                    style: 'background: #fff',
                    renderer: function(storeItem, item) {
                        var browser = item.series.getTitle()[Ext.Array.indexOf(item.series.getYField(), item.field)];
                        this.setHtml(browser + ' for ' + storeItem.get('month') + ': ' + storeItem.get(item.field) + '%');
                    }
                }
            }]
			}
		}) ;
	},
	
	doQuit: function() {
		this.destroy() ;
	},
	onDestroy: function() {
		if( this.autoRefreshTask ) {
			this.autoRefreshTask.cancel() ;
		}
	}
});
