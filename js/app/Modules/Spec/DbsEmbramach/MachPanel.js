Ext.define('DbsEmbramachMachDeliveryModel', {
    extend: 'Ext.data.Model',
    fields: [
        {name: '_filerecord_id', type: 'int'},
		  {name: 'delivery_id', type: 'string'},
		  {name: 'priority_code', type: 'string'},
		  {name: 'type', type: 'string'},
		  {name: 'flow', type: 'string'},
		  {name: 'shipto_code', type: 'string'},
		  {name: 'shipto_name', type: 'string'},
		  {name: 'txt_feedback', type: 'string'},
		  {name: 'step_txt', type: 'string'},
		  {name: 'step_RLS', type: 'auto'},
		  {name: 'step_PCK', type: 'auto'},
		  {name: 'step_QI', type: 'auto'},
		  {name: 'step_INV', type: 'auto'},
		  {name: 'step_AWB', type: 'auto'}
	]
});
Ext.define('Optima5.Modules.Spec.DbsEmbramach.MachPanel',{
	extend:'Ext.panel.Panel',
	
	initComponent: function() {
		var stepRenderer = function(vObj,metaData) {
			if( !vObj ) {
				return '&#160;' ;
			}
			switch( vObj.color ) {
				case 'red' :
				case 'orange' :
				case 'green' :
					metaData.tdCls += ' '+'op5-spec-dbsembramach-gridcell-'+vObj.color ;
					break ;
			}
			return vObj.date_sql.replace(' ','<br>') ;
		};
		
		Ext.apply(this,{
			bodyCls: 'ux-noframe-bg',
			layout: 'border',
			items: [{
				region: 'north',
				height: 116,
				xtype: 'component',
				tpl: [
					'<div class="op5-spec-embramach-banner">',
						'<div class="op5-spec-embramach-banner-inside">',
						'<div class="op5-spec-embramach-banner-left">',
							'<div class="op5-spec-embramach-banner-logo"></div>',
							'<div class="op5-spec-embramach-banner-title">{title}</div>',
						'</div>',
						'<div class="op5-spec-embramach-banner-right">',
							'<div class="op5-spec-embramach-banner-people">Charge&nbsp:&nbsp;<b><font color="red">{people_count}</font>&nbsp;personne(s)</b></div>',
						'</div>',
						'</div>',
						'<div class="op5-spec-embramach-banner-blue">&#160;</div>',
					'</div>'
				],
				data: {title: 'MACH', people_count:0}
			},{
				region: 'center',
				border: false,
				xtype: 'grid',
				itemId: 'pGrid',
				bodyCls: 'op5-spec-dbsembramach-mach-grid',
				store: {
					model: 'DbsEmbramachMachDeliveryModel',
					data: []
				},
				columns:[{
					text: 'Picking',
					dataIndex: 'delivery_id',
					tdCls: 'op5-spec-dbsembramach-bigcolumn',
					width: 110,
					align: 'center'
				},{
					text: 'Priority',
					dataIndex: 'priority_code',
					renderer: function(v,metaData) {
						switch( v ) {
							case '1' :
								return '<font color="red">AOG</font>' ;
							case '2' :
								return '<font color="#CCCD06">CRI</font>' ;
							case '3' :
								return '<font color="#164E89">ROU</font>' ;
						}
					},
					width: 60,
					align: 'center',
					tdCls: 'op5-spec-dbsembramach-bigcolumn'
				},{
					text: 'Flow',
					dataIndex: 'flow',
					width: 60,
					align: 'center',
					tdCls: 'op5-spec-dbsembramach-bigcolumn'
				},{
					text: 'Customer',
					dataIndex: 'shipto_name',
					width: 130
				},{
					text: 'Process step',
					dataIndex: 'step_txt',
					width: 110
				},{
					text: 'RLS',
					dataIndex: 'step_RLS',
					renderer: stepRenderer,
					width: 80,
					align: 'center'
				},{
					text: 'PCK',
					dataIndex: 'step_PCK',
					renderer: stepRenderer,
					width: 80,
					align: 'center'
				},{
					text: 'QI',
					dataIndex: 'step_QI',
					renderer: stepRenderer,
					width: 80,
					align: 'center'
				},{
					text: 'INV',
					dataIndex: 'step_INV',
					renderer: stepRenderer,
					width: 80,
					align: 'center'
				},{
					text: 'AWB',
					dataIndex: 'step_AWB',
					renderer: stepRenderer,
					width: 80,
					align: 'center'
				}],
				plugins: [{
					ptype: 'bufferedrenderer'
				}],
				viewConfig: {
					getRowClass: function(record) {
						if( !Ext.isEmpty(record.get('step_INV')) ) {
							return 'op5-spec-dbsembramach-gridcell-done' ;
						}
					}
				}
			},{
				region: 'east',
				width: 200,
				xtype: 'panel',
				itemId: 'pGauges',
				collapsible: true,
				layout: {
					type: 'vbox',
					align: 'stretch'
				},
				title: 'Performance gauges',
				items: [{
					flex: 1,
					xtype:'panel',
					bodyCls: 'ux-noframe-bg',
					title: '<font color="red">AOG performance</font>',
					layout: 'fit',
					items: [{
						xtype: 'chart',
						style: 'background:#fff',
						animate: {
							easing: 'bounceOut',
							duration: 500
						},
						store: {
							fields: ['name','value'],
							data: [{name:'AOG', value:1.4}]
						},
						insetPadding: 25,
						flex: 1,
						axes: [{
							type: 'gauge',
							position: 'gauge',
							minimum: 0,
							maximum: 4,
							steps: 4,
							margin: 7
						}],
						series: [{
							type: 'gauge',
							field: 'value',
							donut: 80,
							colorSet: ['#FF0000', '#ddd']
						}]
					}]
				},{
					flex: 1,
					xtype:'panel',
					bodyCls: 'ux-noframe-bg',
					title: '<font color="#CCCD06">CRITICAL performance</font>',
					layout: 'fit',
					items: [{
						xtype: 'chart',
						style: 'background:#fff',
						animate: {
							easing: 'bounceOut',
							duration: 500
						},
						store: {
							fields: ['name','value'],
							data: [{name:'CRI', value:27}]
						},
						insetPadding: 25,
						flex: 1,
						axes: [{
							type: 'gauge',
							position: 'gauge',
							minimum: 0,
							maximum: 48,
							steps: 10,
							margin: 7
						}],
						series: [{
							type: 'gauge',
							field: 'value',
							donut: 80,
							colorSet: ['#CCCD06', '#ddd']
						}]
					}]
				},{
					flex: 1,
					xtype:'panel',
					bodyCls: 'ux-noframe-bg',
					title: '<font color="#164E89">ROUTINE performance</font>',
					layout: 'fit',
					items: [{
						xtype: 'chart',
						style: 'background:#fff',
						animate: {
							easing: 'bounceOut',
							duration: 500
						},
						store: {
							fields: ['name','value'],
							data: [{name:'ROU', value:47}]
						},
						insetPadding: 25,
						flex: 1,
						axes: [{
							type: 'gauge',
							position: 'gauge',
							minimum: 0,
							maximum: 96,
							steps: 10,
							margin: 7
						}],
						series: [{
							type: 'gauge',
							field: 'value',
							donut: 80,
							colorSet: ['#164E89', '#ddd']
						}]
					}]
				}]
			}]
		});
		
		this.callParent() ;
		
		this.doLoad() ;
	},
	doLoad: function() {
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_embramach',
				_action: 'mach_getGrid'
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
		var pGrid = this.down('#pGrid'),
			pGauges = this.down('#pGauges'),
			pGridStore = pGrid.getStore() ;
		pGridStore.loadData( jsonResponse.data_grid ) ;
		pGridStore.clearFilter() ;
		pGridStore.filterBy(function(record, id){
			return Ext.Array.contains(['LBG1','LBG2','LBG3'],record.get('flow')) ;
		}, this);
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
	}
});