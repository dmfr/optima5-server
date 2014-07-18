Ext.define('Optima5.Modules.Spec.DbsPeople.QueryResultView',{
	extend: 'Ext.panel.Panel',

	initComponent: function() {
		
		var tplData = {
			modePreview: true,
			tableRows: []
		} ;
		var queryVars = this.data.query_vars ;
		if( !Ext.isEmpty(queryVars['date_start']) && !Ext.isEmpty(queryVars['date_end']) ) {
			tplData.tableRows.push({
				fieldLabel: 'Dates',
				fieldValue: queryVars['date_start'] + ' >> ' + queryVars['date_end']
			}) ;
		}
		tplData.tableRows.push({
			fieldLabel: 'Requête',
			fieldValue: queryVars['q_name']
		}) ;
		
		
		this.tmpModelName = 'DbsPeopleQueryResultModel-' + this.getId() ;
		this.on('destroy',function(p) {
			Ext.ux.dams.ModelManager.unregister( p.tmpModelName ) ;
		}) ;
		
		Ext.apply(this,{
			layout: {
				type:'vbox',
				align:'stretch'
			},
			items:[{
				xtype:'component',
				tpl:[
					'<div class="op5-spec-mrfoxy-statresult-wrap">',
					'<div class="op5-spec-mrfoxy-statresult">',
						'<div class="op5-spec-mrfoxy-statresult-table">',
							'<table class="op5-spec-mrfoxy-statresult-tbl" cellpadding="0" cellspacing="0">',
							'<tpl for="tableRows">',
								'<tr>',
									'<td class="op5-spec-mrfoxy-statresult-tdlabel">{fieldLabel}</td>',
									'<td class="op5-spec-mrfoxy-statresult-tdvalue">{fieldValue}</td>',
								'</tr>',
							'</tpl>',
							'</table>',
						'</div>',
						'<div class="op5-spec-mrfoxy-statresult-icon"></div>',
						'<tpl if="modePreview">',
							'<div class="op5-spec-mrfoxy-statresult-savebtn"></div>',
						'</tpl>',
					'</div>',
					'</div>'
				],
				cls: 'ux-noframe-bg',
				data: tplData,
				height: 72,
				listeners: {
					afterrender: function(cmp) {
						var btnSaveEl = Ext.get(cmp.getEl().down('div.op5-spec-mrfoxy-statresult-savebtn')) ;
						if( btnSaveEl ) {
							btnSaveEl.on('click',this.onBtnSave,this) ;
						}
					},
					scope: this
				}
			},this.buildResultPanel( this.data.result_tab )]
		}) ;
		
		this.callParent() ;
	},
	
	buildResultPanel: function( tabData ) {
		var me = this ;
		
		Optima5.Modules.CrmBase.QueryTemplateManager.loadStyle(me.optimaModule);
		
		var getRowClassFn = function(record,index) {
			var cssClasses = [] ;
			
			if( record.get('detachedRow') ) {
				cssClasses.push('op5crmbase-detachedrow') ;
			}
			
			return cssClasses.join(' ') ;
		} ;
		
		var columns = [] ;
		var fields = [{
			name:'_rowIdx', // server-side rowIdx ( ie related to row_pivotMap )
			type:'int'
		},{
			name:'_id',     // node "_id" (not used here but server available)
			type:'string'
		},{
			name:'_tdCls',     // node "_id" (not used here but server available)
			type:'string'
		}] ;
		Ext.Array.each(tabData.columns, function(columnDef,colIdx) {
			if( columnDef.text_bold == true ) {
				columnDef.text = ''+columnDef.text+'' ;
				columnDef.style = 'font-weight:bold' ;
			}
			if( columnDef.text_italic == true ) {
				columnDef.text = ''+columnDef.text+'' ;
			}
			if( columnDef.is_bold == true ) {
				Ext.apply(columnDef,{
					renderer: function(value,metaData,record) {
						if( record.get('detachedRow') ) {
							return ''+value+'' ;
						} else {
							return ''+value+'' ;
						}
					}
				}) ;
			}
			else if( columnDef.detachedColumn == true ) {
				Ext.apply(columnDef,{
					tdCls: 'op5crmbase-detachedcolumn'
				}) ;
			}
			else if( columnDef.progressColumn == true ) {
				Ext.apply(columnDef,{
					tdCls: 'op5crmbase-progresscolumn',
					renderer: function(value,meta) {
						if( value > 0 ) {
							meta.tdCls = 'op5crmbase-progresscell-pos' ;
							return '+ '+Math.abs(value) ;
						} else if( value < 0 ) {
							meta.tdCls = 'op5crmbase-progresscell-neg' ;
							return '- '+Math.abs(value) ;
						} else if( value==='' ) {
							return '' ;
						} else {
							return '=' ;
						}
					}
				}) ;
			}
			else {
				Ext.apply(columnDef,{
					tdCls: 'op5crmbase-datacolumn'
				}) ;
			}
			Ext.apply(columnDef,{
				align:''
			});
			if( !columnDef.invisible ) {
				columns.push(columnDef);
			}
			
			fields.push({
				name:columnDef.dataIndex,
				type:columnDef.dataType
			});
		},me);
			
		Ext.define(this.tmpModelName, {
			extend: 'Ext.data.Model',
			fields: fields
		});
		
		var tabgrid = Ext.create('Ext.grid.Panel',{
			xtype:'grid',
			flex: 1,
			border:false,
			frame: true,
			cls:'op5crmbase-querygrid-'+me.optimaModule.sdomainId,
			columns:columns,
			store:{
				model:this.tmpModelName,
				data: tabData.data,
				proxy:{
					type:'memory'
				}
			},
			plugins: [Ext.create('Ext.ux.ColumnAutoWidthPlugin', {
				allColumns: true,
				minAutoWidth: 90,
				singleOnly: true,
				suspendAutoSize: (columns.length > 20)
			})]
		});
		
		return tabgrid ;
	},
	
	
	getData: function() {
		var returnData = Ext.clone(this.data) ;
		Ext.apply(returnData,{
			title: this.title
		}) ;
		return returnData ;
	},
	
	onBtnSave: function() {
		this.fireEvent('savepreview',this.data) ;
	}
}) ;