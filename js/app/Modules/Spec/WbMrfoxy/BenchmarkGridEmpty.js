Ext.define('Optima5.Modules.Spec.WbMrfoxy.BenchmarkGridEmpty',{
	extend: 'Ext.grid.Panel',
	
	initComponent: function(){
		Ext.applyIf(this,{
			store: {
				model: 'WbMrfoxyPromoModel',
				data:[]
			},
			columns: {
				defaults:{
					menuDisabled: true,
					draggable: false,
					sortable: false,
					hideable: false,
					resizable: false
				},
				items: [{
					text: '<b>Promo#</b>',
					dataIndex: 'promo_id',
					align: 'left',
					width: 150,
					renderer: function(v) {
						return ''+v+'' ;
					}
				},{
					xtype: 'numbercolumn',
					text: 'Uplift(kg)',
					dataIndex: 'calc_uplift_vol',
					width: 70,
					align: 'right',
					format: '0,0'
				},{
					xtype: 'numbercolumn',
					text: 'Uplift(%)',
					dataIndex: 'calc_uplift_per',
					align: 'right',
					width: 70,
					format: '0.00'
				},{
					text: 'Cost',
					align: 'right',
					width: 70,
					renderer: function(v,m,r) {
						if( r.get('cost_real') > 0 ) {
							v = r.get('cost_real') ;
						} else {
							v = r.get('cost_forecast') ;
						}
						return Ext.util.Format.number(v,'0,0') ;
					}
				},{
					text: 'Cost/kg',
					align: 'right',
					width: 70,
					renderer: function(v,m,r) {
						var cost,
							upliftKg = r.get('calc_uplift_vol') ;
						if( upliftKg <= 0 ) {
							return '' ;
						}
						if( r.get('cost_real') > 0 ) {
							cost = r.get('cost_real') ;
						} else {
							cost = r.get('cost_forecast') ;
						}
						v = Math.round( (cost/upliftKg)*100 ) / 100 ;
						return Ext.util.Format.number(v,'0,0.00') ;
					}
				}]
			}
		});
		this.callParent() ;
	}
});