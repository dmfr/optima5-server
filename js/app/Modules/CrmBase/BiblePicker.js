Ext.define('Optima5.Modules.CrmBase.BiblePicker',{
	extend:'Ext.form.field.Picker',
	alias: 'widget.op5crmbasebiblepicker',
	requires: ['Ext.XTemplate','Ext.grid.Panel'], 
	
	preSubTpl: [
		'<div id="{cmpId}-triggerWrap" data-ref="triggerWrap" class="{triggerWrapCls} {triggerWrapCls}-{ui}">',
			'<div id={cmpId}-inputWrap data-ref="inputWrap" class="{inputWrapCls}-{ui}">'
	],
	
	childEls: ['divicon','divtext'],
	fieldSubTpl: [
		'<div id="{id}" type="{type}" ',
			'<tpl if="size">size="{size}" </tpl>',
			'<tpl if="tabIdx">tabIndex="{tabIdx}" </tpl>',
			'class="{fieldCls} {typeCls} {typeCls}-{ui} {editableCls} {inputCls}" autocomplete="off">',
			'<span id="{cmpId}-divicon" data-ref="divicon" class="biblepicker-icon">&#160;</span>',
			'<span id="{cmpId}-divtext" data-ref="divtext" class="biblepicker-text">&#160;</span>',
		'</div>',
		{
			compiled: true,
			disableFormats: true
		}
	],
			  
	

	isFormField: true,
	submitValue: true,
	//resizable: true,
	myValue : '' ,
	
	bibleId: '' ,
	selectMode: 'single',
	
	initComponent: function() {
		var me = this ;
		if( (me.optimaModule) instanceof Optima5.Module ) {} else {
			Optima5.Helper.logError('CrmBase:BiblePicker','No module reference ?') ;
		}
		
		this.addEvents('iamready') ;
		this.callParent() ;
		
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_action : 'data_getBibleCfg',
				bible_code : this.bibleId
			},
			success: function(response) {
				if( Ext.decode(response.responseText).success == true ) {
					// this.bibleId = bibleId ;
					this.initSetupBible( Ext.decode(response.responseText).data ) ;
				}
				else {
					this.bibleId = '' ;
				}
			},
			scope: this
		});
		
		
	},
	initSetupBible: function( ajaxDataBibleCfg ) {
		var me = this ;
		// me.inputEl.addCls('icon-bible-edit') ;
		//console.dir(me.divicon) ;
		//me.divicon.addCls('biblepicker-iconimg') ;
		// me.inputEl.dom.innerHTML = '<b>ijsiqjdodqsjijsiqjdodqsjijsiqjdodqsjijsiqjdodqsjijsiqjdodqsjijsiqjdodqsjijsiqjdodqsjijsiqjdodqsj</b>' ;
		
		this.myModelname = this.id+'-'+'dynModel' ;
		// Création du modèle GRID
		var modelFields = new Array() ;
		var keyfield = '' ;
		Ext.Object.each( ajaxDataBibleCfg.entry_fields , function(k,v) {
			// console.dir(v) ;
			if( !(v.entry_field_is_highlight) && false )
				return ;
			if( v.entry_field_is_key == true )
				keyfield = v.tree_field_code ;
			
			switch( v.entry_field_type )
			{
				case 'number' :
				case 'date' :
					var fieldType = v.entry_field_type ;
					break ;
					
				default :
					var fieldType = 'string' ;
					break ;
			}
			
			var fieldObject = new Object();
			Ext.apply(fieldObject,{
				name: v.entry_field_code,
				type: fieldType
			}) ;
			modelFields.push( fieldObject ) ;
		},this) ;
		Ext.define(this.myModelname, {
			extend: 'Ext.data.Model',
			fields: modelFields
		});
		
		
		this.myColumns = new Array() ;
		Ext.Object.each( ajaxDataBibleCfg.entry_fields , function(k,v) {
			// console.dir(v) ;
			if( !(v.entry_field_is_highlight) )
				return ;
			if( !(v.entry_field_is_header) )
				return ;
			
			switch( v.entry_field_type )
			{
				default :
					break ;
			}
			
			var columnObject = new Object();
			Ext.apply(columnObject,{
            text: v.entry_field_lib,
            flex: 1,
            sortable: false,
            dataIndex: v.entry_field_code,
				menuDisabled: true,
				xtype:'gridcolumn'
			}) ;
			this.myColumns.push( columnObject ) ;
		},this) ;
		
		this.myStore = Ext.create('Ext.data.Store', {
			model: this.myModelname,
			proxy: me.optimaModule.getConfiguredAjaxProxy({
				extraParams : {
					_action: 'data_getBibleGrid' ,
					bible_code: me.bibleId
				},
				reader: {
					type: 'json',
					rootProperty: 'data',
					totalProperty: 'total'
				}
			})
		});
		
		me.fireEvent('iamready') ;
		me.isReady = true ;
		
		this.on('destroy',function(c){
			Ext.ux.dams.ModelManager.unregister( c.myModelname ) ;
		},this) ;
	},
			
	expand: function() {
		var me = this ;
		if( !me.isReady ) {
			me.on('iamready',function(){
				me.expand();
			},me,{
				single:true
			}) ;
			return ;
		}
		
		if( me.selectMode == 'single' && me.myValue.length == 1 ) {
			var parameters = new Object() ;
			Ext.apply(parameters,{
				filters: [ new Ext.util.Filter({
					property: 'entry_key',
					value   : me.myValue
				})]
			});
			me.myStore.load(parameters) ;
		}
		else {
			me.myStore.load() ;
		}
		
		me.clearInvalid() ;
		
		
		this.callParent() ;
		me.getPicker().getDockedItems('toolbar')[0].query('textfield')[0].focus() ;
	},
	collapse: function() {
		var me = this ;
		this.callParent() ;
		me.isValid() ;
		var textfield = me.getPicker().getDockedItems('toolbar')[0].query('textfield')[0] ;
		textfield.setRawValue('') ;
		me.myStore.removeAll() ;
	},
	onItemClick: function( picker, record ) {
		var me = this,
			oldValue = this.getRawValue() ;
		
		switch( me.selectMode ) {
			case 'multi' :
				if( !Ext.isArray(me.myValue) ) {
					me.myValue = [] ;
				}
				if( !Ext.Array.contains(me.myValue, record.get('entry_key')) ) {
					me.myValue.push(record.get('entry_key')) ;
				}
				
				if( me.myValue.length == 1 ) {
					me.applyPrettyValue([record]) ;
					break ;
				}
				
				var fakeRecords = [] ;
				Ext.Array.each( me.myValue, function(entryKey) {
					fakeRecords.push( Ext.create(this.myModelname,{entry_key:entryKey}) ) ;
				},this);
				me.applyPrettyValue(fakeRecords) ;
				break ;
			case 'single' :
				if( Ext.isEmpty(record) ) {
					me.myValue = [] ;
				} else {
					me.myValue = [record.get('entry_key')] ;
				}
				me.applyPrettyValue([record]) ;
				break ;
		}
		this.fireEvent('change',me,me.getRawValue(),oldValue) ;
		
		me.collapse() ;
	},
			  
	createPicker: function() {
		//console.log('created!!') ;
		var me = this ;
		if( !me.isReady ) {
			return null ;
		}
		
		return Ext.create('Ext.grid.Panel', {
			viewConfig: {
				loadMask: false
			},
			// title: 'Simpsons',
			store: me.myStore,
			columns: me.myColumns,
			height: 200,
			width: 200,
			renderTo: Ext.getBody(),
			floating: true,
			hidden: true,
			focusOnShow: true,
			ownerCt: me.ownerCt,
			pickerField: me,
			tbar : [{
				xtype:'textfield',
				flex:1,
				listeners : {
					change: {
						fn: function(){
							me.onTypeAhead() ;
						},
						scope : me
					}
				}
			},{
				xtype:'button',
				iconCls : 'icon-cancel' ,
				handler : function(button,event) {
					me.setRawValue('') ;
					me.myStore.load() ;
				},
				scope : me
			}],
			listeners: {
				itemclick: {
					fn: me.onItemClick,
					scope : me
				}
			}
		});

	},
	alignPicker: function() {
		var me = this,
				picker;

		if (me.isExpanded) {
				picker = me.getPicker();
				if( me.pickerWidth ) {
					picker.setSize(me.pickerWidth);
				} else if (me.matchFieldWidth) {
					// Auto the height (it will be constrained by min and max width) unless there are no records to display.
					picker.setSize(me.bodyEl.getWidth());
				}
				if (picker.isFloating()) {
					me.doAlign();
				}
		}
	},

			  
	onTypeAhead: function() {
		var me = this ;
		
		// console.log('wrong place !') ;
		var textfield = me.getPicker().getDockedItems('toolbar')[0].query('textfield')[0] ;
		var mvalue = textfield.getRawValue() ;
		
		
		
		if( mvalue.length == 0 ) {
			me.myStore.load() ;
			return ;
		}
		if( mvalue.length < 3 ) {
			me.myStore.removeAll() ;
			return ;
		}
		
		me.myStore.load({
			filters : [new Ext.util.Filter({
				property: 'str_search',
				value   : mvalue
			})]
		});
	},
			  
	applyPrettyValue: function(records) {
		var me = this ;
		
		if( !this.rendered ) {
			me.on('render',function(){
				me.applyPrettyValue(records);
			},me,{
				single:true
			}) ;
			return ;
		}
		
		if( Ext.isEmpty(records) ) {
			me.divicon.removeCls('biblepicker-iconimg-ok') ;
			me.divicon.addCls('biblepicker-iconimg-nok') ;
			me.divtext.dom.innerHTML = '' ;
			return ;
		}
		
		if( records.length == 1 ) {
			var record = records[0] ;
			me.divicon.removeCls('biblepicker-iconimg-nok') ;
			me.divicon.addCls('biblepicker-iconimg-ok') ;
			
			var strArr = new Array() ;
			var val = '' ;
			Ext.each( me.myColumns , function(col) {
				if( val = record.get( col.dataIndex ) ) {
					if( val == record.get('treenode_key') ) {
						strArr.push('('+val+')') ;
					}
					else {
						if( val == record.get('entry_key') ) {
							strArr.push('<b>'+val+'</b>') ;
						}
						else {
							strArr.push(val) ;
						}
					}
				}
			}, me);
			me.divtext.dom.innerHTML = strArr.join(" ") ;
			return ;
		} else {
			var entryKeys = [] ;
			Ext.Array.each( records, function(record) {
				entryKeys.push(record.get('entry_key')) ;
			}) ;
			me.divicon.removeCls('biblepicker-iconimg-nok') ;
			me.divicon.addCls('biblepicker-iconimg-oktree') ;
			me.divtext.dom.innerHTML = entryKeys.join(' / ') ;
		}
	},
			  
	setRawValue: function( mvalue ) {
		var me = this ;
		
		if( typeof mvalue === 'undefined' ) {
			return ;
		}
		
		if( me.getRawValue() == mvalue ) {
			return ;
		}
		
		var myNewValue ;
		switch( me.selectMode ) {
			case 'multi' :
				if( (myNewValue = Ext.JSON.decode(mvalue,true)) == null ) {
					myNewValue = [] ;
					//return ;
				}
				break ;
			case 'single' :
				if( mvalue == null || mvalue == '' ) {
					myNewValue = [] ;
				} else {
					myNewValue = [mvalue] ;
				}
				break ;
		}
		
		if( me.rendered ) {
			me.divicon.removeCls('biblepicker-iconimg-nok') ;
			me.divicon.removeCls('biblepicker-iconimg-ok') ;
			me.divtext.dom.innerHTML = '' ;
		}
		
		var oldValue = me.getRawValue() ;
		me.myValue = myNewValue ;
		this.fireEvent('change',me,me.myValue,oldValue) ;
		
		if( !me.isReady ) {
			me.on('iamready',me.setRawValueApplyPretty,me) ;
			return ;
		}
		else {
			me.setRawValueApplyPretty() ;
		}
	},
		
	setRawValueApplyPretty: function() {
		var me = this ;
		
		if( Ext.isEmpty(me.myValue) ) {
			me.applyPrettyValue() ;
			return ;
		}
		
		
		// ****** create temporary store to load record *******
		var tmpStore = Ext.create('Ext.data.Store', {
			model: me.myModelname,
			proxy: me.optimaModule.getConfiguredAjaxProxy({
				extraParams : {
					_action: 'data_getBibleGrid' ,
					bible_code: me.bibleId
				},
				reader: {
					type: 'json',
					rootProperty: 'data',
					totalProperty: 'total'
				}
			}),
			listeners:{
				scope:me,
				load: function(tstore) {
					//console.log('LOADEDD!!') ;
					if( tstore.getCount() > 0 ) {
						//console.dir(tstore.getRange()) ;
						me.applyPrettyValue(tstore.getRange()) ;
					}
				}
			}
		});
		tmpStore.load({
			filters: [ new Ext.util.Filter({
				property: 'entry_key',
				value   : me.myValue
			})]
		});
	},
	getRawValue: function() {
		var me = this ;
		
		switch( me.selectMode ) {
			case 'multi' :
				return Ext.JSON.encode(me.myValue) ;
				break ;
			case 'single' :
				return ( ( me.myValue.length == 0 ) ? '' : me.myValue[0] ) ;
				break ;
		}
	},
	getErrors: function( curvalue ) {
		var me = this,
			errors = [] ; 
		if( me.myValue.length < 1 && !me.allowBlank ) {
			errors.push(me.blankText);
		}
		return errors;
	}  
});
