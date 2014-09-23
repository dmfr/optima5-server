Ext.define('Optima5.Modules.Spec.DbsPeople.RhCalcAttributePanel',{
	extend:'Ext.panel.Panel',
	
	initComponent: function() {
		var me = this ;
		Ext.apply( me, {
			layout:{
				type:'vbox',
				align:'stretch'
			},
			bodyCls: 'ux-noframe-bg',
			items:[ Ext.apply(me.initHeaderCfg(),{
				height: 100,
				padding: 10
			}),{
				xtype:'grid',
				flex: 1,
				columns: {
					defaults:{
						menuDisabled: true,
						draggable: false,
						sortable: false,
						hideable: false,
						resizable: false,
						groupable: false,
						lockable: false
					},
					items:[{
						dataIndex: 'row_date',
						text: 'Date',
						width: 110
					},{
						dataIndex: 'row_text',
						text: 'Item',
						width: 200
					},{
						dataIndex: 'row_value',
						align: 'center',
						text: 'J/h',
						width: 80,
						renderer: function(v,metaData) {
							if( v > 0 ) {
								v = '+' + Math.abs(v).toString() ;
								metaData.tdCls += ' op5-spec-dbspeople-balance-pos' ;
							} 
							if( v < 0 ) {
								v = '-' + Math.abs(v).toString() ;
								metaData.tdCls += ' op5-spec-dbspeople-balance-neg' ;
							}
							return '<b>'+v+'</b>' ;
						}
					}]
					
				},
				store: {
					model: 'DbsPeopleRhPeopleCalcAttributeRowModel',
					data: [],
					sorters: [{
						property: 'row_date',
						direction: 'DESC'
					}]
				}
			}]
		});
		
		this.callParent() ;
		
		if( this.data ) {
			this.down('#pHeader').update(this.data) ;
			this.down('grid').getStore().loadData( this.data.rows ) ;
		}
	},
	initHeaderCfg: function() {
		var headerCfg = {
			itemId: 'pHeader',
			xtype:'component',
			tpl: [
				'<div class="op5-spec-dbspeople-realvalidhdr">',
					'<div class="op5-spec-dbspeople-realvalidhdr-inline-tbl">',
						'<div class="op5-spec-dbspeople-realvalidhdr-inline-elem op5-spec-dbspeople-rhcalcattributehdr-icon">',
						'</div>',
						'<div class="op5-spec-dbspeople-realvalidhdr-inline-elem">',
							'<table class="op5-spec-dbspeople-realvalidhdr-tbl">',
							'<tr>',
								'<td class="op5-spec-dbspeople-realvalidhdr-tdlabel">People :</td>',
								'<td class="op5-spec-dbspeople-realvalidhdr-tdvalue">{_people_name}</td>',
							'</tr>',
							'<tr>',
								'<td class="op5-spec-dbspeople-realvalidhdr-tdlabel">Compteur :</td>',
								'<td class="op5-spec-dbspeople-realvalidhdr-tdvalue">{_people_calc_attribute_text}</td>',
							'</tr>',
							'<tpl if="calc_date">',
							'<tr>',
								'<td class="op5-spec-dbspeople-realvalidhdr-tdlabel">A date du :</td>',
								'<td class="op5-spec-dbspeople-realvalidhdr-tdvalue">{calc_date}</td>',
							'</tr>',
							'</tpl>',
							'<tr>',
								'<td class="op5-spec-dbspeople-realvalidhdr-tdlabel">Solde :</td>',
								'<td class="op5-spec-dbspeople-realvalidhdr-tdvalue"><b>{calc_value}</b>&nbsp;{calc_unit_txt}</td>',
							'</tr>',
							'</table>',
						'</div>',
					'</div>',
				'</div>'
			]
		} ;
		
		return headerCfg ;
	}
}) ;