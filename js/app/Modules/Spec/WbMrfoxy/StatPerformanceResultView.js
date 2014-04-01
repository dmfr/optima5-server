Ext.define('Optima5.Modules.Spec.WbMrfoxy.StatPerformanceResultView',{
	extend: 'Ext.panel.Panel',

	initComponent: function() {
		
		var tplData = {
			modePreview: this.modePreview,
			tableRows: []
		} ;
		var queryVars = this.data.query_vars ;
		if( queryVars['time_mode'] ) {
			var timeTxt = '' ;
			switch( queryVars['time_mode'] ) {
				case 'TO_DATE' :
					timeTxt = 'Crop to Date ' + queryVars['break_date'] ;
					break ;
				
				case 'FROM_DATE' :
					timeTxt = 'Crop to Go ' + queryVars['break_date'] ;
					break ;
				
				default :
					timeTxt = 'Whole year/crop' ;
					break ;
			}
			tplData.tableRows.push({
				fieldLabel: 'Time mode',
				fieldValue: timeTxt
			}) ;
		}
		if( queryVars['store_text'] ) {
			tplData.tableRows.push({
				fieldLabel: 'Stores',
				fieldValue: queryVars['store_text']
			}) ;
		} else if( queryVars['country_text'] ) {
			tplData.tableRows.push({
				fieldLabel: 'Country',
				fieldValue: queryVars['country_text']
			}) ;
		}
		if( queryVars['prod_text'] ) {
			tplData.tableRows.push({
				fieldLabel: 'Products',
				fieldValue: queryVars['prod_text']
			}) ;
		}
		
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
			
		var tmpModelName = 'QueryResultModel-' + me.getId() ;
		//console.log('Defining a model '+tmpModelName) ;
		Ext.define(tmpModelName, {
			extend: 'Ext.data.Model',
			fields: fields
		});
		
		var tabstore = Ext.create('Ext.data.Store',{
			model:tmpModelName,
			pageSize: (tabData.data.length > 50 ? tabData.data.length : 50 ),
			//pageSize: tabData.data.length,
			buffered: true,
			remoteSort: true, // this just keeps sorting from being disabled
			data: tabData.data,
			proxy:{
				type:'memory'
			},
			
			/* 
			* Custom sort function that overrides the normal store sort function.
			* Basically this pulls all the buffered data into a MixedCollection
			* and applies the sort to that, then it puts the SORTED data back
			* into the buffered store.               
			*/                    
			sort: function(sorters) {
				var collection = new Ext.util.MixedCollection();
				collection.addAll(this.getProxy().data);
				collection.sort(sorters);
				
				this.pageMap.clear();
				this.getProxy().data = collection.getRange();
				this.load();
			}
		});
		
		var tabgrid = Ext.create('Ext.grid.Panel',{
			xtype:'grid',
			flex: 1,
			border:false,
			frame: true,
			cls:'op5crmbase-querygrid-'+me.optimaModule.sdomainId,
			columns:columns,
			store:tabstore,
			/* verticalScroller: {
				numFromEdge: 5,
				trailingBufferZone: 10,
				leadingBufferZone: 20
			},*/
			plugins: [Ext.create('Ext.ux.ColumnAutoWidthPlugin', {allColumns:true, minAutoWidth:90, singleOnly:true})],
			viewConfig: { 
				getRowClass: getRowClassFn
			}
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