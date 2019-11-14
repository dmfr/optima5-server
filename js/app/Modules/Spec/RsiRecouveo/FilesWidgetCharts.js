Ext.define('Optima5.Modules.Spec.RsiRecouveo.FilesWidgetCharts',{
	extend: 'Ext.panel.Panel',
	initComponent: function() {
		var statusColors = [], statusTitles = [] ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getStatusAll(), function(status) {
			if( status.is_disabled ) {
				return ;
			}
			statusColors.push(status.status_color) ;
			statusTitles.push(status.status_txt) ;
		}) ;
		
		var chrtStatusAmountText = Ext.create('Ext.draw.sprite.Text', {
			type: 'text',
			text: '',
			fontSize: 12,
			fontFamily: 'Play, sans-serif',
			width: 100,
			height: 30,
			x: 30, // the sprite x position
			y: 235  // the sprite y position
		});
		var chrtStatusCountText = Ext.create('Ext.draw.sprite.Text', {
			type: 'text',
			text: '',
			fontSize: 12,
			fontFamily: 'Play, sans-serif',
			width: 100,
			height: 30,
			x: 55, // the sprite x position
			y: 235  // the sprite y position
		});
		
		Ext.apply(this,{
			layout: {
				type: 'hbox',
				align: 'middle'
			},
			items: [{
				xtype: 'panel',
				cls: 'chart-no-border',
				width: 315,
				height: 240,
				layout: 'fit',
				border: false,
				items: {
					xtype: 'polar',
					animation: false,
					itemId: 'chrtStatusAmount',
					border: false,
					colors: statusColors,
					store: {
						fields: ['status_id','status_txt', 'amount' ],
						data: []
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
					_textSprite: chrtStatusAmountText,
					sprites: [chrtStatusAmountText],
					plugins: {
						ptype: 'chartitemevents',
						moveEvents: false
					},
					series: [{
						type: 'pie',
						angleField: 'amount',
						donut: 50,
						label: {
							field: 'status_txt',
							calloutLine: {
								color: 'rgba(0,0,0,0)' // Transparent to hide callout line
							},
							renderer: function(val) {
								return ''; // Empty label to hide text
							}
						},
						listeners: {
							itemclick: this.onPolarItemClick,
							scope: this
						},
						//highlight: true,
						tooltip: {
							trackMouse: true,
							style: 'background: #fff',
							renderer: function(storeItem, item) {
								this.setHtml(storeItem.get('status_txt') + ': ' + storeItem.get('amount') + '€');
							}
						}
					}]
				}
			},{
				xtype: 'panel',
				height: 240,
				width: 207,
				layout: 'fit',
				border: false,
				items: {
					xtype: 'polar',
					animation: false,
					itemId: 'chrtStatusCount',
					border: false,
					colors: statusColors,
					store: {
						fields: ['status_id','status_txt', 'count' ],
						data: []
					},
					insetPadding: { top: 10, left: 10, right: 10, bottom: 20 },
					//innerPadding: 20,
					interactions: ['itemhighlight'],
					_textSprite: chrtStatusCountText,
					sprites: [chrtStatusCountText],
					plugins: {
						ptype: 'chartitemevents',
						moveEvents: false
					},
					series: [{
						type: 'pie',
						angleField: 'count',
						donut: 50,
						label: {
							field: 'status_txt',
							calloutLine: {
								color: 'rgba(0,0,0,0)' // Transparent to hide callout line
							},
							renderer: function(val) {
								return ''; // Empty label to hide text
							}
						},
						listeners: {
							itemclick: this.onPolarItemClick,
							scope: this
						},
						//highlight: true,
						tooltip: {
							trackMouse: true,
							style: 'background: #fff',
							renderer: function(storeItem, item) {
								this.setHtml(storeItem.get('status_txt') + ': ' + storeItem.get('count') + '');
							}
						}
					}]
				}
			}]
		}) ;
		
		this.callParent() ;
	},
	
	loadFilesData: function( ajaxData ) {
		
		var map_status_nbFiles = {},
			map_status_amount = {} ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getStatusAll(), function(status) {
			if( status.is_disabled ) {
				return ;
			}
			map_status_nbFiles[status.status_id]=0 ;
			map_status_amount[status.status_id]=0 ;
		}) ;
		Ext.Array.each( ajaxData, function(fileRow) {
			var status = fileRow.status ;
			if( !map_status_nbFiles.hasOwnProperty(status) ) {
				return ;
			}
			map_status_nbFiles[status]++ ;
			map_status_amount[status] += fileRow.inv_amount_due ;
		}) ;
		
		// charts
		var chartStatusAmountData = [],
			chartStatusCountData = [];
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getStatusAll(), function(status) {
			if( status.is_disabled ) {
				return ;
			}
			chartStatusAmountData.push({
				'status_id' : status.status_id,
				'status_txt' : status.status_txt,
				'amount' : Math.round(map_status_amount[status.status_id])
			}) ;
			chartStatusCountData.push({
				'status_id' : status.status_id,
				'status_txt' : status.status_txt,
				'count' : Math.round(map_status_nbFiles[status.status_id])
			}) ;
		}) ;

		var chartStatusAmountTotal = Math.round( Ext.Array.sum( Ext.Object.getValues(map_status_amount)) ),
			chartStatusCountTotal = Ext.Array.sum( Ext.Object.getValues(map_status_nbFiles)) ;
		this.down('#chrtStatusAmount').getStore().loadRawData(chartStatusAmountData) ;
		this.down('#chrtStatusCount').getStore().loadRawData(chartStatusCountData) ;
		
		this.down('#chrtStatusAmount')._textSprite.setAttributes({
			text: 'Répartition ( '+Ext.util.Format.number(chartStatusAmountTotal,'0,000')+' € )'
		},true) ;
		this.down('#chrtStatusCount')._textSprite.setAttributes({
			text: 'Nb Dossiers ( '+chartStatusCountTotal+' )'
		},true) ;
	},
	
	onPolarItemClick: function( series , item ) {
		this.fireEvent('polaritemclick', series, item) ;
	}
}) ;
